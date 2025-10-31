// Utility functions to fetch Vietnam address data from public API
// Using provinces.open-api.vn API with axios

import axios from 'axios'

// Create axios instance for external API (no auth needed)
const addressApiClient = axios.create({
  baseURL: 'https://provinces.open-api.vn/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
})

/**
 * Fetch all provinces/cities of Vietnam
 */
export const fetchProvinces = async () => {
  try {
    const response = await addressApiClient.get('/?depth=1')
    return response.data.map(province => ({
      code: province.code,
      name: province.name
    }))
  } catch (error) {
    console.error('Error fetching provinces:', error)
    // Fallback data if API fails
    return getFallbackProvinces()
  }
}

/**
 * Fetch districts of a province
 */
export const fetchDistricts = async (provinceCode) => {
  try {
    const response = await addressApiClient.get(`/p/${provinceCode}?depth=2`)
    return response.data.districts?.map(district => ({
      code: district.code,
      name: district.name
    })) || []
  } catch (error) {
    console.error('Error fetching districts:', error)
    return []
  }
}

/**
 * Fetch wards of a district
 */
export const fetchWards = async (districtCode) => {
  try {
    const response = await addressApiClient.get(`/d/${districtCode}?depth=2`)
    return response.data.wards?.map(ward => ({
      code: ward.code,
      name: ward.name
    })) || []
  } catch (error) {
    console.error('Error fetching wards:', error)
    return []
  }
}

/**
 * Fallback provinces data in case API fails
 */
const getFallbackProvinces = () => {
  return [
    { code: '01', name: 'Thành phố Hà Nội' },
    { code: '79', name: 'Thành phố Hồ Chí Minh' },
    { code: '31', name: 'Thành phố Hải Phòng' },
    { code: '48', name: 'Thành phố Đà Nẵng' },
    { code: '92', name: 'Thành phố Cần Thơ' },
    { code: '02', name: 'Tỉnh Hà Giang' },
    { code: '04', name: 'Tỉnh Cao Bằng' },
    { code: '06', name: 'Tỉnh Bắc Kạn' },
    { code: '08', name: 'Tỉnh Tuyên Quang' },
    { code: '10', name: 'Tỉnh Lào Cai' },
    { code: '11', name: 'Tỉnh Điện Biên' },
    { code: '12', name: 'Tỉnh Lai Châu' },
    { code: '14', name: 'Tỉnh Sơn La' },
    { code: '15', name: 'Tỉnh Yên Bái' },
    { code: '17', name: 'Tỉnh Hoà Bình' },
    { code: '19', name: 'Tỉnh Thái Nguyên' },
    { code: '20', name: 'Tỉnh Lạng Sơn' },
    { code: '22', name: 'Tỉnh Quảng Ninh' },
    { code: '24', name: 'Tỉnh Bắc Giang' },
    { code: '25', name: 'Tỉnh Phú Thọ' },
    { code: '26', name: 'Tỉnh Vĩnh Phúc' },
    { code: '27', name: 'Tỉnh Bắc Ninh' },
    { code: '30', name: 'Tỉnh Hải Dương' },
    { code: '33', name: 'Tỉnh Hưng Yên' },
    { code: '34', name: 'Tỉnh Thái Bình' },
    { code: '35', name: 'Tỉnh Hà Nam' },
    { code: '36', name: 'Tỉnh Nam Định' },
    { code: '37', name: 'Tỉnh Ninh Bình' },
    { code: '38', name: 'Tỉnh Thanh Hóa' },
    { code: '40', name: 'Tỉnh Nghệ An' },
    { code: '42', name: 'Tỉnh Hà Tĩnh' },
    { code: '44', name: 'Tỉnh Quảng Bình' },
    { code: '45', name: 'Tỉnh Quảng Trị' },
    { code: '46', name: 'Tỉnh Thừa Thiên Huế' },
    { code: '49', name: 'Tỉnh Quảng Nam' },
    { code: '51', name: 'Tỉnh Quảng Ngãi' },
    { code: '52', name: 'Tỉnh Bình Định' },
    { code: '54', name: 'Tỉnh Phú Yên' },
    { code: '56', name: 'Tỉnh Khánh Hòa' },
    { code: '58', name: 'Tỉnh Ninh Thuận' },
    { code: '60', name: 'Tỉnh Bình Thuận' },
    { code: '62', name: 'Tỉnh Kon Tum' },
    { code: '64', name: 'Tỉnh Gia Lai' },
    { code: '66', name: 'Tỉnh Đắk Lắk' },
    { code: '67', name: 'Tỉnh Đắk Nông' },
    { code: '68', name: 'Tỉnh Lâm Đồng' },
    { code: '70', name: 'Tỉnh Bình Phước' },
    { code: '72', name: 'Tỉnh Tây Ninh' },
    { code: '74', name: 'Tỉnh Bình Dương' },
    { code: '75', name: 'Tỉnh Đồng Nai' },
    { code: '77', name: 'Tỉnh Bà Rịa - Vũng Tàu' },
    { code: '80', name: 'Tỉnh Long An' },
    { code: '82', name: 'Tỉnh Tiền Giang' },
    { code: '83', name: 'Tỉnh Bến Tre' },
    { code: '84', name: 'Tỉnh Trà Vinh' },
    { code: '86', name: 'Tỉnh Vĩnh Long' },
    { code: '87', name: 'Tỉnh Đồng Tháp' },
    { code: '89', name: 'Tỉnh An Giang' },
    { code: '91', name: 'Tỉnh Kiên Giang' },
    { code: '93', name: 'Tỉnh Hậu Giang' },
    { code: '94', name: 'Tỉnh Sóc Trăng' },
    { code: '95', name: 'Tỉnh Bạc Liêu' },
    { code: '96', name: 'Tỉnh Cà Mau' }
  ]
}

