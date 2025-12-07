import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Order translations
const orderTranslations = {
  vn: {
    checkout: "Thanh toán",
    myOrders: "Đơn hàng của tôi",
    orderDetail: "Chi tiết đơn hàng",
    orderNumber: "Mã đơn hàng",
    orderTracking: "Tra cứu đơn hàng",
    orderSuccess: "Đặt vé thành công!",
    orderInfo: "Thông tin đơn hàng",
    attendeeInfo: "Thông tin người tham dự",
    attendeeName: "Tên người tham dự",
    attendeeEmail: "Email",
    attendeePhone: "Số điện thoại",
    quantity: "Số lượng",
    totalAmount: "Tổng tiền",
    donationAmount: "Số tiền quyên góp",
    donationPerTicket: "Quyên góp cho mỗi vé",
    confirmOrder: "Xác nhận đặt vé",
    viewMyTickets: "Xem vé của tôi",
    viewOrderDetail: "Xem chi tiết",
    backToEvent: "Quay lại sự kiện",
    backToOrders: "Quay lại danh sách",
    cancelOrder: "Hủy đơn hàng",
    cancelConfirm: "Bạn có chắc muốn hủy đơn hàng này?",
    cancelSuccess: "Hủy đơn hàng thành công",
    cancelError: "Không thể hủy đơn hàng",
    downloadTicket: "Tải vé",
    printTicket: "In vé",
    noOrders: "Chưa có đơn hàng nào",
    noOrdersDescription: "Bạn chưa đặt vé nào. Hãy khám phá các sự kiện!",
    exploreEvents: "Khám phá sự kiện",
    ticketSerial: "Mã vé",
    ticketType: "Loại vé",
    enterOrderNumber: "Nhập mã đơn hàng",
    trackButton: "Tra cứu",
    orderSummary: "Tóm tắt đơn hàng",
    eventInfo: "Thông tin sự kiện",
    paymentInfo: "Thông tin thanh toán",
    paymentMethod: "Phương thức thanh toán",
    paidAt: "Ngày thanh toán",
    createdAt: "Ngày tạo",
    updatedAt: "Cập nhật lần cuối",
    ticket: "Vé",
    tickets: "vé",
    ticketNumber: "Vé #{{number}}",
    checkinStatus: "Trạng thái check-in",
    checkinAt: "Thời gian check-in",
    filterByStatus: "Lọc theo trạng thái",
    filterByPayment: "Lọc theo thanh toán",
    allStatuses: "Tất cả trạng thái",
    allPaymentStatuses: "Tất cả",
    status: {
      PENDING: "Chờ xử lý",
      CONFIRMED: "Đã xác nhận",
      CANCELLED: "Đã hủy",
      COMPLETED: "Hoàn thành"
    },
    paymentStatus: {
      UNPAID: "Chưa thanh toán",
      PAID: "Đã thanh toán",
      REFUNDED: "Đã hoàn tiền"
    },
    checkin: {
      NOT_CHECKED_IN: "Chưa check-in",
      CHECKED_IN: "Đã check-in",
      CANCELLED: "Đã hủy"
    },
    errors: {
      nameRequired: "Tên không được để trống",
      emailRequired: "Email không được để trống",
      emailInvalid: "Email không hợp lệ",
      phoneInvalid: "Số điện thoại không hợp lệ",
      donationRequired: "Vui lòng nhập số tiền quyên góp",
      donationPositive: "Số tiền quyên góp phải lớn hơn 0",
      quantityMin: "Số lượng tối thiểu {{min}} vé",
      quantityMax: "Số lượng tối đa {{max}} vé",
      quantityRequired: "Vui lòng chọn số lượng vé",
      attendeesRequired: "Vui lòng điền đủ thông tin {{count}} người tham dự",
      createOrderFailed: "Không thể tạo đơn hàng. Vui lòng thử lại.",
      orderNotFound: "Không tìm thấy đơn hàng",
      orderNumberRequired: "Vui lòng nhập mã đơn hàng"
    },
    paymentNote: "Đơn hàng đã được tạo nhưng chưa thanh toán. Vui lòng hoàn tất thanh toán để nhận vé.",
    paymentPlaceholder: "Tính năng thanh toán đang được phát triển..."
  },
  en: {
    checkout: "Checkout",
    myOrders: "My Orders",
    orderDetail: "Order Detail",
    orderNumber: "Order Number",
    orderTracking: "Track Order",
    orderSuccess: "Order Placed Successfully!",
    orderInfo: "Order Information",
    attendeeInfo: "Attendee Information",
    attendeeName: "Attendee Name",
    attendeeEmail: "Email",
    attendeePhone: "Phone Number",
    quantity: "Quantity",
    totalAmount: "Total Amount",
    donationAmount: "Donation Amount",
    donationPerTicket: "Donation per ticket",
    confirmOrder: "Confirm Order",
    viewMyTickets: "View My Tickets",
    viewOrderDetail: "View Details",
    backToEvent: "Back to Event",
    backToOrders: "Back to Orders",
    cancelOrder: "Cancel Order",
    cancelConfirm: "Are you sure you want to cancel this order?",
    cancelSuccess: "Order cancelled successfully",
    cancelError: "Unable to cancel order",
    downloadTicket: "Download Ticket",
    printTicket: "Print Ticket",
    noOrders: "No orders yet",
    noOrdersDescription: "You haven't ordered any tickets yet. Explore events!",
    exploreEvents: "Explore Events",
    ticketSerial: "Ticket Serial",
    ticketType: "Ticket Type",
    enterOrderNumber: "Enter order number",
    trackButton: "Track",
    orderSummary: "Order Summary",
    eventInfo: "Event Information",
    paymentInfo: "Payment Information",
    paymentMethod: "Payment Method",
    paidAt: "Paid At",
    createdAt: "Created At",
    updatedAt: "Last Updated",
    ticket: "Ticket",
    tickets: "tickets",
    ticketNumber: "Ticket #{{number}}",
    checkinStatus: "Check-in Status",
    checkinAt: "Check-in Time",
    filterByStatus: "Filter by Status",
    filterByPayment: "Filter by Payment",
    allStatuses: "All Statuses",
    allPaymentStatuses: "All",
    status: {
      PENDING: "Pending",
      CONFIRMED: "Confirmed",
      CANCELLED: "Cancelled",
      COMPLETED: "Completed"
    },
    paymentStatus: {
      UNPAID: "Unpaid",
      PAID: "Paid",
      REFUNDED: "Refunded"
    },
    checkin: {
      NOT_CHECKED_IN: "Not Checked In",
      CHECKED_IN: "Checked In",
      CANCELLED: "Cancelled"
    },
    errors: {
      nameRequired: "Name is required",
      emailRequired: "Email is required",
      emailInvalid: "Invalid email",
      phoneInvalid: "Invalid phone number",
      donationRequired: "Please enter donation amount",
      donationPositive: "Donation amount must be greater than 0",
      quantityMin: "Minimum quantity is {{min}} tickets",
      quantityMax: "Maximum quantity is {{max}} tickets",
      quantityRequired: "Please select quantity",
      attendeesRequired: "Please fill in information for {{count}} attendees",
      createOrderFailed: "Unable to create order. Please try again.",
      orderNotFound: "Order not found",
      orderNumberRequired: "Please enter order number"
    },
    paymentNote: "Order created but not paid yet. Please complete payment to receive tickets.",
    paymentPlaceholder: "Payment feature is under development..."
  }
};

// Ticket translations (already in TicketCard but missing from i18n)
const ticketTranslations = {
  vn: {
    free: "MIỄN PHÍ",
    donation: "QUYÊN GÓP",
    price: "Giá vé",
    sold: "Đã bán",
    total: "Tổng",
    available: "Còn",
    tickets: "vé",
    availability: "Tình trạng",
    soldOut: "Hết vé",
    notOnSale: "Chưa mở bán",
    buyNow: "Đặt vé ngay",
    saleNotStarted: "Chưa bắt đầu bán",
    saleEnded: "Đã kết thúc bán",
    lastDays: "Còn",
    days: "ngày",
    minPerOrder: "Tối thiểu",
    maxPerOrder: "Tối đa",
    donationNote: "* Bạn có thể tự chọn số tiền quyên góp khi đặt vé"
  },
  en: {
    free: "FREE",
    donation: "DONATION",
    price: "Price",
    sold: "Sold",
    total: "Total",
    available: "Available",
    tickets: "tickets",
    availability: "Availability",
    soldOut: "Sold Out",
    notOnSale: "Not On Sale",
    buyNow: "Buy Now",
    saleNotStarted: "Sale Not Started",
    saleEnded: "Sale Ended",
    lastDays: "Last",
    days: "days",
    minPerOrder: "Minimum",
    maxPerOrder: "Maximum",
    donationNote: "* You can choose your donation amount when ordering"
  }
};

// Update i18n files
['vn', 'en'].forEach(lang => {
  const filePath = path.join(__dirname, 'src', 'i18n', 'locales', `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Add order and ticket translations
  data.order = orderTranslations[lang];
  data.ticket = ticketTranslations[lang];
  
  // Write back with proper formatting
  fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
  console.log(`Updated ${lang}.json`);
});

console.log('i18n translations updated successfully!');
