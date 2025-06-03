
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Edit } from "lucide-react";

interface EditableTableCellProps {
  value: number | undefined;
  onSave: (value: number | undefined) => Promise<void>;
  type: 'satisfactionScore' | 'availableHours';
  displaySuffix?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
}

const EditableTableCell: React.FC<EditableTableCellProps> = ({
  value,
  onSave,
  type,
  displaySuffix = "",
  placeholder = "Not set",
  min = "0",
  max,
  step = "1"
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState<string>("");

  const handleEdit = () => {
    setIsEditing(true);
    setEditingValue(value?.toString() || "");
  };

  const handleSave = async () => {
    const numValue = editingValue === '' ? undefined : Number(editingValue);
    await onSave(numValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingValue("");
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <Input
          type="number"
          min={min}
          max={max}
          step={step}
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          className="w-20 text-right"
          autoFocus
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          className="h-6 w-6"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="h-6 w-6"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <span>
        {value !== undefined ? `${value}${displaySuffix}` : placeholder}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleEdit}
        className="h-6 w-6"
      >
        <Edit className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default EditableTableCell;
