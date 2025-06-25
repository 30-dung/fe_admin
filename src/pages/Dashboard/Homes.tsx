// src/main/java/com/example/serversideclinet/controller/Homes.tsx
import PageMeta from "../../components/common/PageMeta";
import AppointmentStatusMetrics from "../../components/ecommerce/AppointmentStatusMetrics"; // Import AppointmentStatusMetrics

import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
// import MonthlyTarget from "../../components/ecommerce/MonthlyTarget"; // REMOVE This line
import StatisticsChart from "../../components/ecommerce/StatisticsChart";

export default function Homes() {
  return (
    <>
      <PageMeta
        title="React.js Ecommerce Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">

        {/* 1. New Position for Appointment Status Metrics - Now covers 4 columns */}
        <div className="col-span-12">
          <AppointmentStatusMetrics />
        </div>

        {/* 2. New Position for EcommerceMetrics and MonthlySalesChart */}
        {/* Changed xl:col-span-8 to xl:col-span-12 to make it span full width on large screens */}
        <div className="col-span-12 xl:col-span-12">
          <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
            {/* <EcommerceMetrics /> */}
            <MonthlySalesChart />
          </div>
        </div>

        


        {/* 4. StatisticsChart remains at the bottom, adjusted span to fit full width */}
        <div className="col-span-12">
          <StatisticsChart />
        </div>
      </div>
    </>
  );
}