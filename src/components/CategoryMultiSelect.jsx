import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getCategories } from "../api/categories";

/**
 * CategoryMultiSelect Component
 * Multi-select dropdown cho categories với search và checkbox
 * 
 * @param {string[]} value - Array các category IDs đã chọn
 * @param {function} onChange - Callback khi thay đổi selection
 * @param {string} placeholder - Placeholder text
 * @param {boolean} disabled - Disabled state
 * @param {string} className - Additional CSS classes
 */
const CategoryMultiSelect = ({
    value = [],
    onChange,
    placeholder,
    disabled = false,
    className = "",
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getCategories();
                setCategories(response || []);
            } catch (error) {
                console.error("Error fetching categories:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Filter categories by search term
    const filteredCategories = categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Toggle category selection
    const toggleCategory = (categoryId) => {
        if (value.includes(categoryId)) {
            onChange(value.filter((id) => id !== categoryId));
        } else {
            onChange([...value, categoryId]);
        }
    };

    // Select/Deselect all
    const toggleAll = () => {
        if (value.length === categories.length) {
            onChange([]);
        } else {
            onChange(categories.map((cat) => cat.id));
        }
    };

    // Remove a selected category
    const removeCategory = (categoryId) => {
        onChange(value.filter((id) => id !== categoryId));
    };

    // Get selected categories data
    const selectedCategories = categories.filter((cat) => value.includes(cat.id));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={`w-full justify-between min-h-[40px] h-auto ${className}`}
                >
                    <div className="flex flex-wrap gap-1 flex-1">
                        {selectedCategories.length > 0 ? (
                            selectedCategories.map((cat) => (
                                <Badge
                                    key={cat.id}
                                    variant="secondary"
                                    className="mr-1 mb-1"
                                    style={{
                                        backgroundColor: cat.color ? `${cat.color}20` : undefined,
                                        borderColor: cat.color || undefined,
                                        color: cat.color || undefined,
                                    }}
                                >
                                    {cat.name}
                                    <button
                                        type="button"
                                        className="ml-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-0.5"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeCategory(cat.id);
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground">
                                {placeholder || t("categories.selectCategories")}
                            </span>
                        )}
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full min-w-[300px] p-0" align="start">
                {/* Search Input */}
                <div className="p-2 border-b">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("common.search") || "Tìm kiếm..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                {/* Select All Option */}
                <div
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent border-b"
                    onClick={toggleAll}
                >
                    <div
                        className={`h-4 w-4 border rounded flex items-center justify-center ${value.length === categories.length && categories.length > 0
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-gray-300"
                            }`}
                    >
                        {value.length === categories.length && categories.length > 0 && (
                            <Check className="h-3 w-3" />
                        )}
                    </div>
                    <span className="font-medium">{t("common.selectAll") || "Chọn tất cả"}</span>
                </div>

                {/* Categories List */}
                <div className="max-h-[250px] overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-muted-foreground">
                            {t("common.loading")}
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                            {t("categories.noCategories") || "Không có danh mục nào"}
                        </div>
                    ) : (
                        filteredCategories.map((category) => {
                            const isSelected = value.includes(category.id);
                            return (
                                <div
                                    key={category.id}
                                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent ${isSelected ? "bg-accent/50" : ""
                                        }`}
                                    onClick={() => toggleCategory(category.id)}
                                >
                                    <div
                                        className={`h-4 w-4 border rounded flex items-center justify-center ${isSelected
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "border-gray-300"
                                            }`}
                                    >
                                        {isSelected && <Check className="h-3 w-3" />}
                                    </div>
                                    <span
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: category.color || "#6B7280" }}
                                    />
                                    <span>
                                        {category.name}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default CategoryMultiSelect;
