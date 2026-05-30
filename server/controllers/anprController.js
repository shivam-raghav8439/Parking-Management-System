import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import NodeWebcam from 'node-webcam';
import RegisteredVehicle from '../models/RegisteredVehicle.js';
import AnprLog from '../models/AnprLog.js';
import Record from '../models/Record.js';
import Slot from '../models/Slot.js';
import { findBestSlot } from '../utils/slotAssigner.js';
import { logSystemActivity } from '../utils/logger.js';
import { SLOT_STATUSES, RECORD_STATUSES } from '../config/constants.js';
import { mockController } from '../utils/mockController.js';

// Setup node-webcam options
const webcamOptions = {
  width: 1280,
  height: 720,
  quality: 100,
  output: "jpeg",
  device: false,
  callbackReturn: "buffer",
  verbose: false
};

const Webcam = NodeWebcam.create(webcamOptions);

/**
 * @desc    Recognize plate number from base64 image
 * @route   POST /api/anpr/recognize
 * @access  Private
 */
export const recognizePlate = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.recognize(req, res, next);
  }
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, message: 'Image base64 data is required.' });
    }

    // Strip out base64 header if it exists
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Preprocess image using Sharp to boost Tesseract OCR accuracy
    // Grayscale, scale up, increase contrast
    let processedBuffer;
    try {
      processedBuffer = await sharp(imageBuffer)
        .grayscale()
        .resize(1000) // Upscale slightly for OCR character definition
        .threshold() // Convert to clean black/white
        .toBuffer();
    } catch (err) {
      console.warn("Sharp preprocessing failed, falling back to raw buffer:", err.message);
      processedBuffer = imageBuffer;
    }

    // Perform OCR
    const ocrResult = await Tesseract.recognize(processedBuffer, 'eng');
    const text = ocrResult.data.text || "";
    const confidence = ocrResult.data.confidence || 0;

    // Filter characters to identify standard license plate strings
    const cleanedText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const matches = cleanedText.match(/[A-Z0-9]{6,10}/);
    const plate = matches ? matches[0] : cleanedText.substring(0, 10);

    res.status(200).json({
      success: true,
      plate: plate || 'UNKNOWN',
      confidence,
      rawText: text.trim()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Auto-entry gate opening for recognized license plates
 * @route   POST /api/anpr/auto-entry
 * @access  Private
 */
export const autoEntry = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.autoEntry(req, res, next);
  }
  try {
    const { plate } = req.body;
    const formattedPlate = plate.toUpperCase().trim();

    // 1. Locate registered vehicle in pre-registration whitelists
    const vehicle = await RegisteredVehicle.findOne({ plate: formattedPlate, isActive: true });
    if (!vehicle) {
      // Log event as failed match
      await AnprLog.create({
        plate: formattedPlate,
        confidence: 100,
        result: 'failed',
        message: 'Vehicle not registered in system registry.'
      });

      return res.status(200).json({
        success: false,
        message: 'Vehicle not registered'
      });
    }

    // 2. Prevent entry conflicts if already checked in
    const activeRecord = await Record.findOne({ plate: formattedPlate, status: RECORD_STATUSES.ACTIVE });
    if (activeRecord) {
      await AnprLog.create({
        plate: formattedPlate,
        confidence: 100,
        result: 'failed',
        message: `Denied auto-entry: Vehicle already parked in slot ${activeRecord.slotId}.`
      });

      return res.status(409).json({
        success: false,
        message: `Vehicle is already parked inside slot ${activeRecord.slotId}.`
      });
    }

    // 3. Obtain optimal available parking slot
    const slotDoc = await findBestSlot(vehicle.vehicleType, 'Auto');
    if (!slotDoc) {
      await AnprLog.create({
        plate: formattedPlate,
        confidence: 100,
        result: 'failed',
        message: `Denied auto-entry: No available slots for category '${vehicle.vehicleType}'.`
      });

      return res.status(409).json({
        success: false,
        message: `No available slots matching vehicle category '${vehicle.vehicleType}'.`
      });
    }

    // 4. Create checking record marked as automated entry
    const record = await Record.create({
      plate: vehicle.plate,
      ownerName: vehicle.ownerName,
      ownerType: vehicle.ownerType,
      vehicleType: vehicle.vehicleType,
      mobile: vehicle.mobile || '',
      slot: slotDoc._id,
      slotId: slotDoc.slotId,
      zone: slotDoc.zone,
      entryTime: new Date(),
      status: RECORD_STATUSES.ACTIVE,
      isAutoEntry: true,
      createdBy: req.user?._id || null
    });

    // 5. Secure slot occupied status
    slotDoc.status = SLOT_STATUSES.OCCUPIED;
    slotDoc.currentRecord = record._id;
    await slotDoc.save();

    // 6. Update vehicle analytics visits
    vehicle.totalVisits += 1;
    vehicle.lastSeen = new Date();
    await vehicle.save();

    // 7. Write success ANPR event log
    await AnprLog.create({
      plate: vehicle.plate,
      confidence: 100,
      result: 'success',
      message: `Auto-entry success. Gate opened, assigned slot: ${slotDoc.slotId}`,
      slotNumber: slotDoc.slotId
    });

    // 8. Log system event
    await logSystemActivity(
      'VEHICLE_ENTRY',
      `ANPR Auto-Entry checked in ${record.vehicleType} plate ${record.plate} (Owner: ${record.ownerName}) into slot ${record.slotId}.`,
      req.user?._id
    );

    res.status(200).json({
      success: true,
      slot: slotDoc.slotId,
      message: `Auto-entry success! Allocated slot: ${slotDoc.slotId}`,
      record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Query system webcam hardware connection status
 * @route   GET /api/anpr/status
 * @access  Private
 */
export const getCameraStatus = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.getCameraStatus(req, res, next);
  }
  
  // Test physical webcam connection status
  Webcam.list((list) => {
    // If we have camera devices listed, or check command outputs
    const cameraConnected = list && list.length > 0;
    res.status(200).json({
      success: true,
      cameraConnected,
      status: cameraConnected ? 'Online' : 'Offline',
      details: cameraConnected ? `Detected cameras: ${list.join(', ')}` : 'No local camera inputs identified. Capture fallbacks to front-end media devices.'
    });
  });
};

/**
 * @desc    Pre-register vehicle for automated gates whitelist
 * @route   POST /api/anpr/vehicles
 * @access  Private
 */
export const registerVehicle = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.registerVehicle(req, res, next);
  }
  try {
    const { plate, ownerName, ownerType, vehicleType, mobile, photo } = req.body;
    const formattedPlate = plate.toUpperCase().trim();

    // Check if plate already registered
    const existing = await RegisteredVehicle.findOne({ plate: formattedPlate });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Plate ${formattedPlate} is already registered under ${existing.ownerName}.`
      });
    }

    const vehicle = await RegisteredVehicle.create({
      plate: formattedPlate,
      ownerName,
      ownerType,
      vehicleType,
      mobile: mobile || '',
      photo: photo || '',
      isActive: true,
      registeredAt: new Date()
    });

    await logSystemActivity(
      'SETTINGS_UPDATE',
      `Registered vehicle ${vehicle.plate} for auto-entry (Owner: ${vehicle.ownerName}, Category: ${vehicle.ownerType}).`,
      req.user?._id
    );

    res.status(201).json({
      success: true,
      message: 'Vehicle pre-registered successfully',
      data: vehicle
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List and search registered whitelist vehicles
 * @route   GET /api/anpr/vehicles
 * @access  Private
 */
export const getRegisteredVehicles = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.getRegisteredVehicles(req, res, next);
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      query.$or = [
        { plate: regex },
        { ownerName: regex },
        { mobile: regex }
      ];
    }
    if (req.query.ownerType) {
      query.ownerType = req.query.ownerType;
    }
    if (req.query.vehicleType) {
      query.vehicleType = req.query.vehicleType;
    }

    const vehicles = await RegisteredVehicle.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await RegisteredVehicle.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch ANPR logs to display alongside whitelists
    const recentLogs = await AnprLog.find().sort({ timestamp: -1 }).limit(10);

    res.status(200).json({
      success: true,
      vehicles,
      recentLogs,
      totalCount,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/deregister vehicle from automated gate whitelist
 * @route   DELETE /api/anpr/vehicles/:id
 * @access  Private
 */
export const deleteRegisteredVehicle = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.deleteRegisteredVehicle(req, res, next);
  }
  try {
    const vehicle = await RegisteredVehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Pre-registered vehicle record not found.' });
    }

    await logSystemActivity(
      'SETTINGS_UPDATE',
      `Deregistered vehicle ${vehicle.plate} (Owner: ${vehicle.ownerName}).`,
      req.user?._id
    );

    res.status(200).json({
      success: true,
      message: 'Vehicle removed from pre-registration database.'
    });
  } catch (error) {
    next(error);
  }
};
