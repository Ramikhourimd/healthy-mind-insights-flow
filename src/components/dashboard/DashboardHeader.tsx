
import React from "react";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/context/FinanceContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const months = [
  "January", "February", "March", "April", 
  "May", "June", "July", "August", 
  "September", "October", "November", "December"
];

const years = [2024, 2025, 2026, 2027];

export const DashboardHeader: React.FC = () => {
  const { currentPeriod, setCurrentPeriod } = useFinance();

  const handleMonthChange = (value: string) => {
    setCurrentPeriod({
      ...currentPeriod,
      month: parseInt(value) + 1,
    });
  };

  const handleYearChange = (value: string) => {
    setCurrentPeriod({
      ...currentPeriod,
      year: parseInt(value),
    });
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Financial Dashboard</h1>
        <p className="text-gray-500 mt-1">
          HealthyMind Clinic Performance Overview
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Select 
            value={(currentPeriod.month - 1).toString()} 
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={month} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={currentPeriod.year.toString()} 
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button>Export Data</Button>
      </div>
    </div>
  );
};
