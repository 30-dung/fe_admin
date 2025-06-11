  import { useState, useRef, useEffect } from "react";
  import FullCalendar from "@fullcalendar/react";
  import dayGridPlugin from "@fullcalendar/daygrid";
  import timeGridPlugin from "@fullcalendar/timegrid";
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
    };
  }

  const Calendar: React.FC = () => {
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
      null
    );
    const [eventTitle, setEventTitle] = useState("");
    const [eventStartDate, setEventStartDate] = useState("");
    const [eventEndDate, setEventEndDate] = useState("");
    const [eventLevel, setEventLevel] = useState("");
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const calendarRef = useRef<FullCalendar>(null);
    const { isOpen, openModal, closeModal } = useModal();

    const calendarsEvents = {
      Danger: "danger",
      Success: "success",
      Primary: "primary",
      Warning: "warning",
    };

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const employeeId = user?.id;

    useEffect(() => {
    const fetchWorkingTimeSlots = async () => {
      try {
        const response = await axios.get(url.WORKING_TIME_SLOT.GET_BY_EMPLOYEE, {
          params: { employeeId }, // sửa theo ID nhân viên thật nếu cần
        });

        const data = response.data || [];

        const mappedEvents: CalendarEvent[] = data.map((slot: any) => ({
          id: slot.id?.toString() || Date.now().toString(),
          title: slot.title || "Working Slot",
          start: slot.startTime,
          end: slot.endTime,
          allDay: false,
          extendedProps: { calendar: "Success" }, // hoặc dùng slot.level nếu có
        }));

        setEvents(mappedEvents);
      } catch (error) {
        console.error("Error fetching working time slots:", error);
      }
    };

    fetchWorkingTimeSlots();
  }, []);

    const handleDateSelect = (selectInfo: DateSelectArg) => {
      resetModalFields();
      setEventStartDate(selectInfo.startStr);
      setEventEndDate(selectInfo.endStr || selectInfo.startStr);
      openModal();
    };

    const handleEventClick = (clickInfo: EventClickArg) => {
      const event = clickInfo.event;
      setSelectedEvent(event as unknown as CalendarEvent);
      setEventTitle(event.title);
      setEventStartDate(event.start?.toISOString().split("T")[0] || "");
      setEventEndDate(event.end?.toISOString().split("T")[0] || "");
      setEventLevel(event.extendedProps.calendar);
      openModal();
    };

  const handleAddOrUpdateEvent = async () => {
    if (!eventStartDate || !eventEndDate) {
      alert("Vui lòng chọn thời gian bắt đầu và kết thúc.");
      return;
    }

    if (selectedEvent) {
      // Nếu bạn có logic cập nhật ca làm trong DB, thêm ở đây.
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? {
                ...event,
                title: eventTitle,
                start: eventStartDate,
                end: eventEndDate,
                extendedProps: { calendar: eventLevel },
              }
            : event
        )
      );
    } else {
      try {
        const payload = {
          employeeId: employeeId, // cập nhật theo người dùng thực tế
          startTime: new Date(eventStartDate).toISOString(),
          endTime: new Date(eventEndDate).toISOString(),
          description: eventTitle || "Ca làm",
        };

        await axios.post(url.WORKING_TIME_SLOT.CREATE, payload);

        // Tải lại lịch làm việc
        const response = await axios.get(url.WORKING_TIME_SLOT.GET_BY_EMPLOYEE, {
          params: { employeeId },
        });

        const mappedEvents: CalendarEvent[] = response.data.map((slot: any) => ({
          id: slot.id?.toString() || Date.now().toString(),
          title: slot.description || "Ca làm",
          start: slot.startTime,
          end: slot.endTime,
          allDay: false,
          extendedProps: { calendar: "Success" },
        }));

        setEvents(mappedEvents);
      } catch (error) {
        console.error("Lỗi khi đăng ký ca làm:", error);
        alert("Không thể đăng ký ca làm. Vui lòng thử lại.");
      }
    }

    closeModal();
    resetModalFields();
  };


    const resetModalFields = () => {
      setEventTitle("");
      setEventStartDate("");
      setEventEndDate("");
      setEventLevel("");
      setSelectedEvent(null);
    };

    return (
      <>
        <PageMeta
          title="React.js Calendar Dashboard | TailAdmin - Next.js Admin Dashboard Template"
          description="This is React.js Calendar Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
        />
        <div className="rounded-2xl border  border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="custom-calendar">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next addEventButton",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              selectable={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              customButtons={{
                addEventButton: {
                  text: "Add Event +",
                  click: openModal,
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
      <div className="mt-8">
        {/* Tên nhân viên (tự động lấy từ user đăng nhập) */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Tên nhân viên</label>
          <input
            type="text"
            value={user?.fullName || user?.name || ""}
            disabled
            className="w-full border px-3 py-2 rounded bg-gray-100"
          />
        </div>
        {/* Ca làm */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Ca làm</label>
          <select
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          >
            <option value="">-- Chọn ca --</option>
            <option value="Sáng">Sáng</option>
            <option value="Chiều">Chiều</option>
            <option value="Tối">Tối</option>
          </select>
        </div>
        {/* Ghi chú */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Ghi chú</label>
          <textarea
            value={eventLevel}
            onChange={(e) => setEventLevel(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            rows={2}
          />
        </div>
        {/* Ngày bắt đầu */}
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
        {/* Ngày kết thúc */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Ngày kết thúc</label>
          <input
            type="date"
            value={eventEndDate}
            onChange={(e) => setEventEndDate(e.target.value)}
            className="w-full border px-3 py-2 rounded"
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
