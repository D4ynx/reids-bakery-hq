import React from "react";

interface CalendarViewProps {}

export default function CalendarView(_: CalendarViewProps) {
  return (
    <div className="max-w-6xl mx-auto h-[80vh] flex flex-col animate-fadeIn w-full">
      <header className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#562D07]">
          Delivery Scheduler
        </h2>
        <p className="text-[#562D07]/70 mt-1 font-medium text-sm md:text-base">
          Google Calendar Integration
        </p>
      </header>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-[#F3B978] flex items-center justify-center p-4 md:p-8">
        <div className="text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-[#F3B978]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 md:w-10 md:h-10 text-[#F17D0C]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-[#562D07] mb-2">
            Calendar View Placeholder
          </h3>
          <p className="text-[#562D07]/70 max-w-sm md:max-w-md mx-auto text-sm md:text-base">
            This space is reserved for the Google Calendar integration.
          </p>
        </div>
      </div>
    </div>
  );
}