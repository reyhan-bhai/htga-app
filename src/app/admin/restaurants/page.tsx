"use client";

import EntityModal, { FieldConfig } from "@/components/admin/EntityModal";
import { useState } from "react";

import TableComponent from "@/components/table/Table";
import {
  Button,
  Checkbox,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import React from "react";
import { MdAdd, MdClose, MdFilterList, MdSearch } from "react-icons/md";

const columns = [
  { name: "ID", uid: "id" },
  { name: "Eating Establishments", uid: "eating_establishments" },
  { name: "Address", uid: "address" },
  { name: "Contact", uid: "contact" },
  { name: "Rating", uid: "rating" },
  { name: "Budget (MYR)", uid: "budget" },
  { name: "Halal Status", uid: "halal_status" },
  { name: "Remarks", uid: "remarks" },
  { name: "Actions", uid: "actions" },
];

const restaurants = [
  {
    id: "09989",
    eating_establishments: "Adam's Kitchen - Taman Kota Masai",
    address:
      "53 Jalan Ekoperniagaan 2 Taman Kota Masai 81700 Pasir Gudang, Johor",
    contact: "+60188708556",
    rating: "4.7",
    budget: "50",
    halal_status: "Muslim-Owned",
    remarks:
      "Source: https://www.facebook.com/100090730221994/videos/%F0%9D%9F%AD%F0%9D%9F%B5-%F0%9D%97%A0%F0%9D%97%AE%F0%9D%97%BF%F0%9D%97%B0%F0%9D%97%B5-%F0%9D%9F%AE%F0%9D%9F%AC%F0%9D%9F%AE%F0%9D%9F%B0%F0%9D%97%9C%F0%9D%98%81%F0%9D%98%80-%F0%9D%97%AE%F0%9D%97%BB-%F0%9D%97%B5%F0%9D%97%BC%F0%9D%97%BB%F0%9D%97%BC%F0%9D%98%82%F0%9D%97%BF-%F0%9D%98%81%F0%9D%97%BC-%F0%9D%97%B5%F0%9D%97%AE%F0%9D%98%83%F0%9D%97%B2-%F0%9D%97%96%F0%9D%97%B5%F0%9D%97%B2%F0%9D%97%B3-%F0%9D%97%A0%F0%9D%98%82%F0%9D%97%B5%F0%9D%97%AE%F0%9D%97%BA%F0%9D%97%BA%F0%9D%97%AE%F0%9D%97%B1-%F0%9D%97%A5%F0%9D%97%B2%F0%9D%97%B1%F0%9D%98%87%F0%9D%98%82%F0%9D%97%AE%F0%9D%97%BB-%F0%9D%97%A7%F0%9D%97%B5%F0%9D%97%B6%F0%9D%97%AE%F0%9D%97%BB-%F0%9D%97%A3%F0%9D%97%BB-%F0%9D%97%A6%F0%9D%97%B5%F0%9D%97%AE%F0%9D%98%87%F0%9D%97%AE%F0%9D%97%BB%F0%9D%97%AE-%F0%9D%97%A2%F0%9D%98%84%F0%9D%97%BB%F0%9D%97%B2%F0%9D%97%BF-/1596492297819022/",
  },
  {
    id: "09990",
    eating_establishments: "ADS Corner's - Pusat Perdagangan Kebun Teh",
    address:
      "No 44, Jalan Kebun Teh 1, Pusat Perdagangan Kebun Teh 80250 Johor Bahru, Johor",
    contact: "+60142449717",
    rating: "4.3",
    budget: "50",
    halal_status: "Muslim-friendly",
    remarks: "Source: Their menu",
  },
  {
    id: "09991",
    eating_establishments: "Alina Bakery",
    address:
      "S11-01, Pusat Komersil Visi Medini Persiaran Medini 2, Iskandar Puteri, 79250 Johor Bahru, Johor Darul Ta'zim",
    contact: "075102287",
    rating: "4.9",
    budget: "50",
    halal_status: "Muslim-friendly",
    remarks: "Source: https://www.instagram.com/reel/DGX0pTBpavo/?hl=en",
  },
  {
    id: "09992",
    eating_establishments: "Beriani Bonda House 1969 - BBU",
    address:
      "No 29, Jalan Padi Emas 3/1 Bandar Baru Uda 81200 Johor Bahru, Johor",
    contact: "+60127933310",
    rating: "4.6",
    budget: "50",
    halal_status: "Muslim-Owned",
    remarks:
      "Source: https://www.google.com/search?q=Beriani+Bonda+House+1969+story",
  },
  {
    id: "09993",
    eating_establishments: "Big Food - Taman Nong Chik",
    address:
      "No 1, Jln Kolam Air, Tmn Nong Chik Height 80200 Johor Bahru Johor",
    contact: "+60177313386",
    rating: "4.2",
    budget: "100",
    halal_status: "Muslim-Owned",
    remarks: "Source: https://www.instagram.com/p/BdzQkzcH8HJ/?hl=en",
  },
  {
    id: "09994",
    eating_establishments: "Bite By Majid Murtabak - Larkin Jaya",
    address: "No.11, Jalan Cenderawasih, Larkin Jaya 80350 Johor Bahru, Johor",
    contact: "+60177555305",
    rating: "4.5",
    budget: "50",
    halal_status: "Muslim-friendly",
    remarks: "Their menu",
  },
  {
    id: "09995",
    eating_establishments: "Brew & Chill - Lovell @ Country Garden Danga Bay",
    address:
      "Lovell @ Country Garden Danga Bay, Unit 3-02 Danga Avenue, Persiaran Danga Perdana, Country Garden Danga Bay 80200 Johor Bahru, Johor",
    contact: "+60146116908",
    rating: "4.6",
    budget: "50",
    halal_status: "Muslim-Owned",
    remarks: "https://www.instagram.com/brewnchill.my/?hl=en",
  },
  {
    id: "09996",
    eating_establishments: "Bubur Nasi No 1 - Jalan Dataran Larkin 6",
    address: "No. 12, Jalan Dataran Larkin 6, Larkin 80350 Johor Bahru, Johor",
    contact: "+60177169699",
    rating: "4.6",
    budget: "50",
    halal_status: "Muslim-Owned",
    remarks: "https://www.instagram.com/p/CZ61Dk6JlOu/",
  },
];

// Restaurant field configuration for the modal
const restaurantFields: FieldConfig[] = [
  {
    name: "eating_establishments",
    label: "Restaurant Name",
    type: "text",
    placeholder: "Type your Restaurant Name...",
    required: true,
  },
  {
    name: "address",
    label: "Full Address",
    type: "textarea",
    placeholder: "Enter full address...",
    rows: 3,
  },
  {
    name: "contact",
    label: "Restaurant Contact",
    type: "text",
    placeholder: "Contact / Website",
  },
  {
    name: "rating",
    label: "Rating",
    type: "text",
    placeholder: "e.g., 4.7",
  },
  {
    name: "budget",
    label: "Budget (MYR)",
    type: "text",
    placeholder: "e.g., 50",
  },
  {
    name: "halal_status",
    label: "Halal Status",
    type: "select",
    placeholder: "Select Halal Status",
    options: ["Muslim-Owned", "Muslim-friendly", "Halal Certified by JAKIM"],
  },
  {
    name: "remarks",
    label: "Remarks",
    type: "textarea",
    placeholder: "Additional notes or source links...",
    rows: 2,
  },
];

export default function RestaurantsPage() {
  const [page, setPage] = React.useState(1);
  const [selectedCities, setSelectedCities] = React.useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = React.useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState<any>(null);

  const handleAddRestaurant = () => {
    setSelectedRestaurant(null);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleViewRestaurant = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleSaveRestaurant = async (restaurant: any) => {
    try {
      // TODO: Implement API call to save restaurant
      console.log("Saving restaurant:", restaurant);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving restaurant:", error);
    }
  };

  const handleEditRestaurant = (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleDeleteRestaurant = (restaurant: any) => {
    setRestaurantToDelete(restaurant);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    // TODO: Implement API call to delete restaurant
    console.log("Deleting restaurant:", restaurantToDelete);
    setIsDeleteModalOpen(false);
    setRestaurantToDelete(null);
  };

  const cities = ["Johor", "Kuala Lumpur", "Penang", "Selangor"];
  const statuses = ["Assigned", "Unassigned"];

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSelectedCities([]);
    setSelectedStatus([]);
  };

  const activeFiltersCount = selectedCities.length + selectedStatus.length;

  return (
    <div className="text-black flex flex-col gap-6">
      <h2 className="text-2xl font-bold uppercase">Restaurant Management</h2>

      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 md:bg-transparent">
        <div className="flex flex-row gap-3 w-full md:w-auto items-center">
          {/* Search Input */}
          <Input
            placeholder="Search by name, email, ID, city or status..."
            className="w-full md:w-[350px]"
            size="sm"
            variant="bordered"
            startContent={<MdSearch className="text-black" size={18} />}
            classNames={{
              inputWrapper: "bg-white border-gray-300 rounded-md text-red",
              input: "text-black placeholder:text-gray-500",
            }}
          />

          {/* Filter Popover */}
          <Popover placement="bottom-start">
            <PopoverTrigger>
              <Button
                isIconOnly
                className="bg-white border border-gray-300 rounded-md relative overflow-visible"
                size="sm"
              >
                <MdFilterList size={20} className="text-gray-500" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#A67C37] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center z-10 border-2 border-white">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-4 w-[280px] bg-white shadow-lg rounded-lg">
              <div className="flex flex-col gap-4 text-black">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-base">Filters</span>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-[#A67C37] hover:underline flex items-center gap-1"
                    >
                      <MdClose size={14} />
                      Clear all
                    </button>
                  )}
                </div>

                <Divider className="bg-gray-200" />

                {/* City Filter */}
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm text-gray-700">
                    City
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {cities.map((city) => (
                      <Checkbox
                        key={city}
                        size="sm"
                        isSelected={selectedCities.includes(city)}
                        onValueChange={() => toggleCity(city)}
                        classNames={{
                          label: "text-black text-sm",
                        }}
                      >
                        {city}
                      </Checkbox>
                    ))}
                  </div>
                </div>

                <Divider className="bg-gray-200" />

                {/* Status Filter */}
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm text-gray-700">
                    Status
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map((status) => (
                      <Checkbox
                        key={status}
                        size="sm"
                        isSelected={selectedStatus.includes(status)}
                        onValueChange={() => toggleStatus(status)}
                        classNames={{
                          label: "text-black text-sm",
                        }}
                      >
                        {status}
                      </Checkbox>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Button
          className="bg-[#A67C37] text-white font-semibold rounded-full p-0"
          startContent={<MdAdd size={30} />}
          onPress={handleAddRestaurant}
        ></Button>
      </div>

      <div className="bg-white rounded-lg">
        <TableComponent
          columns={columns}
          data={restaurants}
          onEdit={handleEditRestaurant}
          onView={handleViewRestaurant}
          onDelete={handleDeleteRestaurant}
        />
      </div>

      <div className="flex justify-center items-center mt-4">
        <div className="block md:hidden">
          <Pagination
            isCompact
            showControls
            total={10}
            page={page}
            onChange={setPage}
            siblings={0}
            classNames={{
              cursor: "bg-[#A67C37] text-white font-bold",
            }}
          />
        </div>
        <div className="hidden md:block">
          <Pagination
            showControls
            total={10}
            page={page}
            onChange={setPage}
            classNames={{
              cursor: "bg-[#A67C37] text-white font-bold",
            }}
          />
        </div>
      </div>

      <EntityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRestaurant}
        entity={selectedRestaurant}
        mode={modalMode}
        fields={restaurantFields}
        title={{
          add: "ADD / EDIT RESTAURANT",
          edit: "ADD / EDIT RESTAURANT",
          view: "Detail Restaurant",
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-black">
                Confirm Delete
              </ModalHeader>
              <ModalBody>
                <p className="text-black">
                  Are you sure you want to delete{" "}
                  <span className="font-bold">
                    {restaurantToDelete?.eating_establishments}
                  </span>
                  ? This action cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="danger" onPress={confirmDelete}>
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
