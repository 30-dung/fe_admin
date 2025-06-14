import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import PageMeta from "../components/common/PageMeta";
import axios from "../service/api";
import url from "../service/url";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    storeId?: number;
  };
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { isOpen, openModal, closeModal } = useModal();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentDate = new Date().toISOString().split("T")[0]; // June 14, 2025

  useEffect(() => {
    const fetchWorkingTimeSlots = async () => {
      try {
        const response = await axios.get(url.WORKING_TIME_SLOT.GET_BY_EMPLOYEE);
        const data = response.data || [];

        const mappedEvents: CalendarEvent[] = data.map((slot: any) => ({
          id: slot.timeSlotId?.toString() || Date.now().toString(),
          title: slot.description || "Ca làm",
          start: slot.startTime,
          end: slot.endTime,
          allDay: false,
          extendedProps: { 
            calendar: slot.isAvailable ? "Success" : "Danger",
            storeId: slot.store?.storeId
          },
        }));

        setEvents(mappedEvents);
      } catch (error) {
        console.error("Error fetching working time slots:", error);
      }
    };

    fetchWorkingTimeSlots();
  }, []);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const selectedDate = selectInfo.startStr.split("T")[0];
    resetModalFields(selectedDate);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    const start = event.start ? new Date(event.start) : null;
    const end = event.end ? new Date(event.end) : null;
    setEventStartDate(start ? start.toISOString().split("T")[0] : "");
    setEventStartTime(start ? start.toISOString().slice(11, 16) : "");
    setEventEndDate(end ? end.toISOString().split("T")[0] : "");
    setEventEndTime(end ? end.toISOString().slice(11, 16) : "");
    openModal();
  };

  const handleShiftChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEventTitle(e.target.value);
    switch (e.target.value) {
      case "Sáng":
        setEventStartTime("07:00");
        setEventEndTime("17:00");
        break;
      case "Chiều":
        setEventStartTime("09:00");
        setEventEndTime("21:00");
        break;
      case "Tối":
        setEventStartTime("13:00");
        setEventEndTime("23:00");
        break;
      default:
        setEventStartTime("");
        setEventEndTime("");
    }
  };

  const handleAddOrUpdateEvent = async () => {
    if (!eventStartDate || !eventEndDate || !eventStartTime || !eventEndTime) {
      alert("Vui lòng chọn thời gian bắt đầu và kết thúc.");
      return;
    }

    const startDateTime = `${eventStartDate}T${eventStartTime}:00`;
    const endDateTime = `${eventEndDate}T${eventEndTime}:00`;

    // Kiểm tra thời gian không vượt quá 12 giờ
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours > 12) {
      alert("Không thể đăng ký ca làm dài hơn 12 tiếng.");
      return;
    }

    try {
      const payload = {
        startTime: startDateTime,
        endTime: endDateTime,
        description: eventTitle || "Ca làm",
      };

      await axios.post(url.WORKING_TIME_SLOT.CREATE, payload);

      const response = await axios.get(url.WORKING_TIME_SLOT.GET_BY_EMPLOYEE);
      const mappedEvents: CalendarEvent[] = response.data.map((slot: any) => ({
        id: slot.timeSlotId?.toString() || Date.now().toString(),
        title: slot.description || "Ca làm",
        start: slot.startTime,
        end: slot.endTime,
        allDay: false,
        extendedProps: { 
          calendar: slot.isAvailable ? "Success" : "Danger",
          storeId: slot.store?.storeId
        },
      }));

      setEvents(mappedEvents);

      closeModal();
      resetModalFields();
    } catch (error: any) {
      console.error("Lỗi khi đăng ký ca làm:", error);
      alert(error.response?.data?.message || "Không thể đăng ký ca làm. Vui lòng thử lại.");
    }
  };

  const resetModalFields = (date = currentDate) => {
    setEventTitle("");
    setEventStartDate(date);
    setEventStartTime("");
    setEventEndDate(date);
    setEventEndTime("");
    setSelectedEvent(null);
  };

  return (
    <>
      <PageMeta
        title="Lịch làm việc nhân viên"
        description="Quản lý lịch làm việc của nhân viên"
      />
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next addEventButton",
              center: "title",
              right: "dayGridMonth,dayGridWeek,dayGridDay",
            }}
            events={events}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              addEventButton: {
                text: "Thêm ca làm +",
                click: () => {
                  resetModalFields();
                  openModal();
                },
              },
            }}
          />
        </div>
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[700px] p-6 lg:p-10"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Sửa lịch làm việc" : "Đăng ký lịch làm việc"}
              </h5>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block mb-1 font-medium">Tên nhân viên</label>
                <input
                  type="text"
                  value={user?.fullName || "Nguyễn Duy Hải"}
                  disabled
                  className="w-full border px-3 py-2 rounded bg-gray-100"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Ca làm</label>
                <select
                  value={eventTitle}
                  onChange={handleShiftChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                >
                  <option value="">-- Chọn ca --</option>
                  <option value="Sáng">Sáng</option>
                  <option value="Chiều">Chiều</option>
                  <option value="Tối">Tối</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Giờ bắt đầu</label>
                <input
                  type="time"
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  disabled
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Ngày kết thúc</label>
                <input
                  type="date"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Giờ kết thúc</label>
                <input
                  type="time"
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  disabled
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Đóng
              </button>
              <button
                onClick={handleAddOrUpdateEvent}
                type="button"
                className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              >
                {selectedEvent ? "Cập nhật" : "Đăng ký"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

const renderEventContent = (eventInfo: any) => {
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}
    >
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default Calendar;