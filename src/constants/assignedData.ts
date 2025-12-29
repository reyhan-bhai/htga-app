// Columns for Evaluator View
export const evaluatorColumns = [
  { name: "Eva ID", uid: "eva_id" },
  { name: "Name", uid: "name" },
  { name: "Email", uid: "email" },
  { name: "Phone", uid: "phone" },
  { name: "Specialty", uid: "specialty" },
  { name: "NDA Status", uid: "nda_status" },
  { name: "Send Reminder", uid: "nda_reminder" },
  // { name: "Rest. 1", uid: "restaurant_1" },
  // { name: "Rest. 2", uid: "restaurant_2" },
  { name: "Reminder Sent", uid: "total_reminder_sent" },
  { name: "Completed", uid: "restaurant_completed" },
];

// Columns for Restaurant View
export const restaurantColumns = [
  { name: "Name", uid: "name" },
  { name: "Category", uid: "category" },
  { name: "Matched", uid: "matched" },
  { name: "Date Assigned", uid: "date_assigned" },
  { name: "Evaluator 1", uid: "evaluator_1" },
  { name: "Eva 1 Progress", uid: "completed_eva_1" },
  { name: "Evaluator 2", uid: "evaluator_2" },
  { name: "Eva 2 Progress", uid: "completed_eva_2" },
  { name: "Actions", uid: "actions" },
];

// // Dummy data for Evaluator View
// export const evaluatorData = [
//   {
//     id: "1",
//     eva_id: "EVA001",
//     name: "Fajar Ramdani",
//     email: "fajar@email.com",
//     phone: "+60146111987",
//     specialty: "Italian, Bakery",
//     nda_sent: "2024-01-15",
//     nda_reminder: "2024-01-20",
//     nda_status: "Signed",
//     restaurant_1: 3,
//     restaurant_2: 4,
//     total_restaurant: 8,
//     restaurant_completed: 3,
//   },
//   {
//     id: "2",
//     eva_id: "EVA002",
//     name: "Raihan Muhammad",
//     email: "raihan@email.com",
//     phone: "+60146112345",
//     specialty: "Fast Food",
//     nda_sent: "2024-01-16",
//     nda_reminder: "-",
//     nda_status: "Pending",
//     restaurant_1: "Big Food",
//     restaurant_2: "-",
//     total_restaurant: 3,
//     restaurant_completed: 1,
//   },
//   {
//     id: "3",
//     eva_id: "EVA003",
//     name: "Ayunda Cinta",
//     email: "ayunda@email.com",
//     phone: "+60146119876",
//     specialty: "Bakery, Pastry",
//     nda_sent: "2024-01-17",
//     nda_reminder: "2024-01-22",
//     nda_status: "Not Sent",
//     restaurant_1: "-",
//     restaurant_2: "-",
//     total_restaurant: 0,
//     restaurant_completed: 0,
//   },
//   {
//     id: "4",
//     eva_id: "EVA004",
//     name: "Putra Indika",
//     email: "putra@email.com",
//     phone: "+60146115678",
//     specialty: "Asian Cuisine",
//     nda_sent: "2024-01-18",
//     nda_reminder: "-",
//     nda_status: "Signed",
//     restaurant_1: "Alina Bakery",
//     restaurant_2: "Beriani Bonda",
//     total_restaurant: 4,
//     restaurant_completed: 4,
//   },
// ];

// // Dummy data for Restaurant View
// export const restaurantData = [
//   {
//     id: "1",
//     name: "Adam's Kitchen - Taman Kota Masai",
//     category: "Local Cuisine",
//     matched: "Yes",
//     date_assigned: "2024-01-15",
//     evaluator_1: "Fajar Ramdani",
//     completed_eva_1: "Yes",
//     evaluator_2: "Raihan Muhammad",
//     completed_eva_2: "No",
//   },
//   {
//     id: "2",
//     name: "ADS Corner's - Pusat Perdagangan",
//     category: "Fast Food",
//     matched: "Yes",
//     date_assigned: "2024-01-16",
//     evaluator_1: "Fajar Ramdani",
//     completed_eva_1: "Yes",
//     evaluator_2: "Putra Indika",
//     completed_eva_2: "Yes",
//   },
//   {
//     id: "3",
//     name: "Alina Bakery",
//     category: "Bakery",
//     matched: "Yes",
//     date_assigned: "2024-01-17",
//     evaluator_1: "Putra Indika",
//     completed_eva_1: "Yes",
//     evaluator_2: "-",
//     completed_eva_2: "-",
//   },
//   {
//     id: "4",
//     name: "Beriani Bonda House 1969",
//     category: "Local Cuisine",
//     matched: "No",
//     date_assigned: "-",
//     evaluator_1: "-",
//     completed_eva_1: "-",
//     evaluator_2: "-",
//     completed_eva_2: "-",
//   },
//   {
//     id: "5",
//     name: "Big Food - Taman Nong Chik",
//     category: "Fast Food",
//     matched: "Partial",
//     date_assigned: "2024-01-18",
//     evaluator_1: "Raihan Muhammad",
//     completed_eva_1: "No",
//     evaluator_2: "-",
//     completed_eva_2: "-",
//   },
// ];

// // Dummy evaluators list for manual matching
// export const evaluatorsList = [
//   { id: "EVA001", name: "Fajar Ramdani" },
//   { id: "EVA002", name: "Raihan Muhammad" },
//   { id: "EVA003", name: "Ayunda Cinta" },
//   { id: "EVA004", name: "Putra Indika" },
// ];

// // Dummy restaurants list for manual matching
// export const restaurantsList = [
//   { id: "REST001", name: "Adam's Kitchen" },
//   { id: "REST002", name: "ADS Corner's" },
//   { id: "REST003", name: "Alina Bakery" },
//   { id: "REST004", name: "Beriani Bonda House 1969" },
//   { id: "REST005", name: "Big Food" },
// ];

// Filter options
export const ndaStatuses = ["Signed", "Pending", "Not Sent"];
export const matchStatuses = ["Yes", "No", "Partial"];
