import { useState, useEffect, useRef } from 'react';
import { Search, Plus, X } from 'lucide-react';

interface AutocompleteInputProps {
    value: string;
    onChange: (value: string) => void;
    onSearch: (query: string) => Promise<string[]>;
    onAddNew?: () => void;
    placeholder?: string;
    className?: string;
}

export default function AutocompleteInput({
    value,
    onChange,
    onSearch,
    onAddNew,
    placeholder = 'ابحث أو اكتب...',
    className = '',
}: AutocompleteInputProps) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [allSuggestions, setAllSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
                setSearchQuery('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputClick = async () => {
        if (value.trim()) {
            // If there's already a value, don't open dropdown
            return;
        }

        // Load all templates when clicking empty field
        setLoading(true);
        try {
            const results = await onSearch('');
            setAllSuggestions(results);
            setSuggestions(results);
            setShowSuggestions(true);
            setSearchQuery('');
        } catch (error) {
            console.error('Error loading templates:', error);
            setSuggestions([]);
            setAllSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSuggestion = (suggestion: string) => {
        onChange(suggestion);
        setShowSuggestions(false);
        setSuggestions([]);
        setAllSuggestions([]);
        setSearchQuery('');
    };

    const handleClearValue = () => {
        onChange('');
        handleInputClick();
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSuggestions(allSuggestions);
        } else {
            const filtered = allSuggestions.filter(item =>
                item.toLowerCase().includes(query.toLowerCase())
            );
            setSuggestions(filtered);
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={handleInputClick}
                    placeholder={placeholder}
                    className={`${className} pr-10`}
                />
                {value ? (
                    <button
                        type="button"
                        onClick={handleClearValue}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-4 h-4" />
                    </button>
                ) : (
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                )}
            </div>

            {showSuggestions && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <div className="relative">
                            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="ابحث..."
                                className="w-full pr-8 pl-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Suggestions List */}
                    <div className="overflow-y-auto max-h-48">
                        {loading ? (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                جاري التحميل...
                            </div>
                        ) : (
                            <>
                                {suggestions.length > 0 ? (
                                    suggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleSelectSuggestion(suggestion)}
                                            className="w-full px-3 py-2 text-right text-sm text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                                        >
                                            {suggestion}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                        {searchQuery ? 'لا توجد نتائج' : 'لا توجد بنود'}
                                    </div>
                                )}
                                {onAddNew && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowSuggestions(false);
                                            setSearchQuery('');
                                            onAddNew();
                                        }}
                                        className="w-full px-3 py-2 text-right text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-2 border-t border-blue-200 dark:border-blue-800"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        إضافة بند جديد
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
