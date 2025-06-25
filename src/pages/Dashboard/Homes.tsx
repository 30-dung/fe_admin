// src/main/java/com/example/serversideclinet/controller/Homes.tsx
import PageMeta from "../../components/common/PageMeta";
import AppointmentStatusMetrics from "../../components/ecommerce/AppointmentStatusMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";

export default function Homes() {
  return (
    <>
      <PageMeta
        title="React.js Ecommerce Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">

        {/* 1. Appointment Status Metrics */}
        <div className="col-span-12">
          <AppointmentStatusMetrics />
        </div>

        {/* 2. Monthly Sales Chart - Responsive positioning next to Rejected metric */}
        {/* When Rejected is shown (Admin): Monthly chart takes 8 columns on xl, 6 on lg */}
        {/* When Rejected is hidden (Employee): Monthly chart takes full 12 columns */}
        <div className="col-span-12">
          <MonthlySalesChart />
        </div>

        {/* 4. StatisticsChart remains at the bottom */}
        <div className="col-span-12">
          <StatisticsChart />
        </div>
      </div>
    </>
  );
}