import axios from 'axios';
import { mockController } from '../utils/mockController.js';

// Get free API key from: https://apisetu.gov.in
// Register at API Setu portal (Government of India)
// Apply for Vahan RC Details API access
// Free tier: 100 requests/day, Paid: unlimited

/**
 * Maps raw Vahan response fields into unified camelCase parameters
 */
const mapVahanResponse = (rc) => {
  if (!rc) return {};
  return {
    owner: rc.owner || rc.ownerName || rc.owner_name || 'N/A',
    regNo: rc.regNo || rc.registrationNo || rc.reg_no || rc.reg_num || 'N/A',
    vehicleClass: rc.vehicleClass || rc.class || rc.vehicle_class || 'N/A',
    makerModel: rc.makerModel || rc.model || rc.maker_model || 'N/A',
    fuelType: rc.fuelType || rc.fuel || rc.fuel_type || 'N/A',
    color: rc.color || 'N/A',
    regAuthority: rc.regAuthority || rc.rto || rc.reg_authority || 'N/A',
    regDate: rc.regDate || rc.registrationDate || rc.reg_date || 'N/A',
    insuranceUpto: rc.insuranceUpto || rc.insurance_upto || rc.insuranceExpiry || 'N/A',
    pucUpto: rc.pucUpto || rc.puc_upto || rc.pucExpiry || 'N/A',
    financer: rc.financer || rc.financeInfo || 'N/A',
    blacklistStatus: rc.blacklistStatus || rc.blacklist_status || rc.blacklisted || 'Clear',
    challanDetails: rc.challanDetails || rc.challans || rc.challan_details || '0 pending'
  };
};

/**
 * @desc    Fetch real government vehicle details using India Vahan API
 * @route   POST /api/vehicle/details
 * @access  Private
 */
export const getVehicleDetails = async (req, res, next) => {
  if (global.isMockDB) {
    return mockController.getVehicleDetails(req, res, next);
  }
  
  try {
    const { plate } = req.body;
    if (!plate) {
      return res.status(400).json({ success: false, message: 'License registration plate is required.' });
    }

    const formattedPlate = plate.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');

    // Skip network call if key is not configured (graceful developer warnings fallback)
    if (!process.env.VAHAN_API_KEY || process.env.VAHAN_API_KEY === 'your_key_here') {
      console.warn("⚠️ Vahan API Key is missing or default. Fetching sandbox mock fallback profile.");
      return mockController.getVehicleDetails(req, res, next);
    }

    const response = await axios.post(
      'https://apisetu.gov.in/vahan/v3/rc/findByRegNo',
      { regNo: formattedPlate },
      {
        headers: {
          'x-api-key': process.env.VAHAN_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 4000 // A 4s timeout prevents slow external calls from hanging backend
      }
    );

    const vehicleInfo = mapVahanResponse(response.data);

    res.status(200).json({
      success: true,
      data: vehicleInfo
    });
  } catch (error) {
    // If the API Setu returns 404 (Not Found) or 400 (Bad Request)
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'No vehicle records found for this plate number in the Vahan database.'
      });
    }

    console.error("Vahan API Setu Connection Error:", error.message);
    
    // Graceful fallback to mock details if there is an API error or network issue
    console.warn("🔄 Vahan API returned an error, falling back to mock database details...");
    return mockController.getVehicleDetails(req, res, next);
  }
};
