import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Building2,
    Check,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Image,
    Info,
    Save,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { createOrganization } from '../api/organizations';
import Header from '../components/Header';
import ImageUploader from '../components/ImageUploader';
import { useAuth } from '../contexts/AuthContext';

const STEPS = [
    { id: 0, key: 'general', icon: Info, labelKey: 'organization.tabs.general' },
    { id: 1, key: 'contact', icon: Building2, labelKey: 'organization.tabs.contact' },
    { id: 2, key: 'bank', icon: CreditCard, labelKey: 'organization.tabs.bank' },
    { id: 3, key: 'media', icon: Image, labelKey: 'organization.tabs.media' },
];

const CreateOrganization = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        logo_url: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        bank_name: '',
        bank_account_number: '',
        bank_account_name: '',
    });
    const [errors, setErrors] = useState({});
    const [alert, setAlert] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    // Terms dialog state
    const [showTermsDialog, setShowTermsDialog] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Redirect nếu chưa đăng nhập
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Xóa error khi user nhập
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Tự động tạo slug từ name nếu trường slug trống
        if (name === 'name' && !formData.slug) {
            const autoSlug = value
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();
            setFormData(prev => ({ ...prev, slug: autoSlug }));
        }
    };

    // Validate current step
    const validateCurrentStep = () => {
        const newErrors = {};

        if (currentStep === 0) {
            // General tab validation
            if (!formData.name.trim()) {
                newErrors.name = t('organization.nameRequired') || 'Tên tổ chức không được để trống';
            } else if (formData.name.trim().length < 3) {
                newErrors.name = t('organization.nameMinLength');
            }

            if (!formData.slug.trim()) {
                newErrors.slug = t('organization.slugRequired');
            } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
                newErrors.slug = t('organization.slugInvalid') || 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang';
            }
        } else if (currentStep === 1) {
            // Contact tab validation
            if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
                newErrors.contact_email = t('register.emailInvalid');
            }
        }
        // Step 2 (Bank) and Step 3 (Media) have no required fields

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = (e) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (validateCurrentStep()) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
        }
    };

    const handlePrevious = (e) => {
        e?.preventDefault();
        e?.stopPropagation();
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    // Handle form submit - show terms dialog first
    const handleSubmit = (e) => {
        e.preventDefault();
        setAlert({ type: '', message: '' });

        if (!validateCurrentStep()) {
            return;
        }

        // Show terms dialog
        setShowTermsDialog(true);
        setAcceptedTerms(false);
    };

    // Handle actual submission after accepting terms
    const handleConfirmCreate = async () => {
        if (!acceptedTerms) return;

        setShowTermsDialog(false);
        setLoading(true);

        try {
            // Chỉ gửi các trường có giá trị
            const payload = {};
            if (formData.name.trim()) payload.name = formData.name.trim();
            if (formData.slug.trim()) payload.slug = formData.slug.trim();
            if (formData.description.trim()) payload.description = formData.description.trim();
            if (formData.logo_url.trim()) payload.logo_url = formData.logo_url.trim();
            if (formData.contact_email.trim()) payload.contact_email = formData.contact_email.trim();
            if (formData.contact_phone.trim()) payload.contact_phone = formData.contact_phone.trim();
            if (formData.address.trim()) payload.address = formData.address.trim();
            if (formData.bank_name.trim()) payload.bank_name = formData.bank_name.trim();
            if (formData.bank_account_number.trim()) payload.bank_account_number = formData.bank_account_number.trim();
            if (formData.bank_account_name.trim()) payload.bank_account_name = formData.bank_account_name.trim();

            await createOrganization(payload);

            setAlert({
                type: 'success',
                message: t('organization.createSuccess'),
            });

            // Redirect về dashboard sau 2 giây
            setTimeout(() => {
                navigate('/dashboard');
                window.location.reload();
            }, 2000);
        } catch (error) {
            let errorMessage = t('organization.createError');

            if (error.message) {
                if (Array.isArray(error.message)) {
                    errorMessage = error.message.join(', ');
                } else {
                    errorMessage = error.message;
                }
            }

            if (error.status === 400 && errorMessage.includes('Slug')) {
                setErrors(prev => ({ ...prev, slug: errorMessage }));
                setCurrentStep(0); // Go back to first step to show error
            } else {
                setAlert({ type: 'error', message: errorMessage });
            }
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 gap-y-5">
                            {/* Name */}
                            <div>
                                <Label htmlFor="name">
                                    {t('organization.name')} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder={t('organization.namePlaceholder')}
                                    className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t('organization.nameHint')}
                                </p>
                            </div>

                            {/* Slug */}
                            <div>
                                <Label htmlFor="slug">
                                    {t('organization.slug')} <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="slug"
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    placeholder={t('organization.slugPlaceholder')}
                                    className={`mt-1 ${errors.slug ? 'border-red-500' : ''}`}
                                />
                                {errors.slug && (
                                    <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                                )}
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t('organization.slugHint')}
                                </p>
                            </div>

                            {/* Description */}
                            <div>
                                <Label htmlFor="description">{t('organization.description')}</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder={t('organization.descriptionPlaceholder')}
                                    rows={4}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 gap-y-5">
                            {/* Contact Email */}
                            <div>
                                <Label htmlFor="contact_email">{t('organization.contactEmail')}</Label>
                                <Input
                                    id="contact_email"
                                    type="email"
                                    name="contact_email"
                                    value={formData.contact_email}
                                    onChange={handleChange}
                                    placeholder={t('organization.contactEmailPlaceholder')}
                                    className={`mt-1 ${errors.contact_email ? 'border-red-500' : ''}`}
                                />
                                {errors.contact_email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>
                                )}
                            </div>

                            {/* Contact Phone */}
                            <div>
                                <Label htmlFor="contact_phone">{t('organization.contactPhone')}</Label>
                                <Input
                                    id="contact_phone"
                                    type="tel"
                                    name="contact_phone"
                                    value={formData.contact_phone}
                                    onChange={handleChange}
                                    placeholder={t('organization.contactPhonePlaceholder')}
                                    className="mt-1"
                                />
                            </div>

                            {/* Address */}
                            <div>
                                <Label htmlFor="address">{t('organization.address')}</Label>
                                <Input
                                    id="address"
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder={t('organization.addressPlaceholder')}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                        <p className="text-sm text-muted-foreground mb-4">
                            {t('organization.bankInfoHint', 'Vui lòng nhập đầy đủ thông tin ngân hàng. Nền tảng chỉ trả tiền khi tổ chức có đủ 3 trường này và đã được bật payout.')}
                        </p>

                        <div className="grid grid-cols-1 gap-y-5">
                            {/* Bank Name */}
                            <div>
                                <Label htmlFor="bank_name">
                                    {t('organization.bankName', 'Ngân hàng')}
                                </Label>
                                <Input
                                    id="bank_name"
                                    type="text"
                                    name="bank_name"
                                    value={formData.bank_name}
                                    onChange={handleChange}
                                    placeholder={t('organization.bankNamePlaceholder', 'Vietcombank, Techcombank...')}
                                    className="mt-1"
                                />
                            </div>

                            {/* Bank Account Number */}
                            <div>
                                <Label htmlFor="bank_account_number">
                                    {t('organization.bankAccountNumber', 'Số tài khoản ngân hàng')}
                                </Label>
                                <Input
                                    id="bank_account_number"
                                    type="text"
                                    name="bank_account_number"
                                    value={formData.bank_account_number}
                                    onChange={handleChange}
                                    placeholder="0123456789"
                                    className="mt-1"
                                />
                            </div>

                            {/* Bank Account Name */}
                            <div>
                                <Label htmlFor="bank_account_name">
                                    {t('organization.bankAccountName', 'Tên chủ tài khoản')}
                                </Label>
                                <Input
                                    id="bank_account_name"
                                    type="text"
                                    name="bank_account_name"
                                    value={formData.bank_account_name}
                                    onChange={handleChange}
                                    placeholder={t('organization.bankAccountNamePlaceholder', 'NGUYEN VAN A')}
                                    className="mt-1"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t('organization.bankAccountNameHint', 'Nhập đúng tên chủ tài khoản (viết hoa, không dấu)')}
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                        <ImageUploader
                            currentImageUrl={formData.logo_url}
                            onImageUploaded={(url) => setFormData(prev => ({ ...prev, logo_url: url || '' }))}
                            label={t('organization.logo') || 'Logo tổ chức'}
                            disabled={loading}
                        />

                        {formData.logo_url && (
                            <div className="mt-6">
                                <Label className="mb-2 block">{t('event.preview') || 'Xem trước'}</Label>
                                <div className="w-32 h-32 rounded-lg overflow-hidden border">
                                    <img
                                        src={formData.logo_url}
                                        alt="Logo preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    const isLastStep = currentStep === STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <Header />
            <div className="container mx-auto px-4 py-10">
                <div className="max-w-5xl mx-auto">
                    {/* Title Section */}
                    <div className="mb-10">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                            {t('organization.createTitle')}
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            {t('organization.createSubtitle')}
                        </p>
                    </div>

                    {alert.message && (
                        <Alert
                            variant={alert.type === 'error' ? 'destructive' : 'default'}
                            className="mb-6"
                        >
                            <AlertDescription>{alert.message}</AlertDescription>
                        </Alert>
                    )}

                    {/* Steps Indicator */}
                    <div className="mb-10">
                        <div className="flex items-center justify-center">
                            {STEPS.map((step, index) => {
                                const Icon = step.icon;
                                const isCompleted = index < currentStep;
                                const isCurrent = index === currentStep;

                                return (
                                    <div key={step.id} className="flex items-center">
                                        {/* Step Circle */}
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted
                                                    ? 'bg-purple-600 border-purple-600 text-white'
                                                    : isCurrent
                                                        ? 'border-purple-600 text-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                                        : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                                                    }`}
                                            >
                                                {isCompleted ? (
                                                    <Check className="w-6 h-6" />
                                                ) : (
                                                    <Icon className="w-6 h-6" />
                                                )}
                                            </div>
                                            <span
                                                className={`mt-3 text-sm font-medium ${isCurrent
                                                    ? 'text-purple-600'
                                                    : isCompleted
                                                        ? 'text-gray-900 dark:text-white'
                                                        : 'text-gray-400 dark:text-gray-500'
                                                    }`}
                                            >
                                                {t(step.labelKey, step.key.charAt(0).toUpperCase() + step.key.slice(1))}
                                            </span>
                                        </div>

                                        {/* Connector Line */}
                                        {index < STEPS.length - 1 && (
                                            <div
                                                className={`w-16 md:w-28 h-1 mx-3 ${index < currentStep
                                                    ? 'bg-purple-600'
                                                    : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Form Content */}
                    <form
                        onSubmit={handleSubmit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.type !== 'submit') {
                                e.preventDefault();
                            }
                        }}
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-10 md:p-12 min-h-[450px]">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 border-b pb-4">
                                {t(STEPS[currentStep].labelKey + 'Title', STEPS[currentStep].key.charAt(0).toUpperCase() + STEPS[currentStep].key.slice(1))}
                            </h3>
                            {renderStepContent()}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="mt-6 flex justify-between items-center">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/')}
                                disabled={loading}
                            >
                                <X className="w-4 h-4 mr-2" />
                                {t('common.cancel')}
                            </Button>

                            <div className="flex gap-3">
                                {!isFirstStep && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handlePrevious}
                                        disabled={loading}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" />
                                        {t('event.previous') || 'Quay lại'}
                                    </Button>
                                )}

                                {isLastStep ? (
                                    <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                                        <Save className="w-4 h-4 mr-2" />
                                        {loading ? t('common.loading') : t('organization.createButton')}
                                    </Button>
                                ) : (
                                    <Button type="button" onClick={handleNext} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
                                        {t('event.next') || 'Tiếp theo'}
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* Terms and Conditions Dialog */}
            <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            {t('organization.termsDialogTitle', 'Điều khoản và Điều kiện')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('organization.termsDialogDescription', 'Vui lòng đọc kỹ và đồng ý với các điều khoản trước khi tạo tổ chức.')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 max-h-[300px] overflow-y-auto text-sm text-gray-700 dark:text-gray-300 space-y-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {t('organization.termsTitle', '1. Điều khoản sử dụng dịch vụ tổ chức sự kiện')}
                            </h3>
                            <p>
                                {t('organization.terms1', 'Khi tạo tổ chức trên nền tảng Ticket Crate, bạn đồng ý tuân thủ các quy định sau:')}
                            </p>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>{t('organization.terms2', 'Cung cấp thông tin chính xác và đầy đủ về tổ chức của bạn.')}</li>
                                <li>{t('organization.terms3', 'Đảm bảo các sự kiện được tổ chức tuân thủ pháp luật Việt Nam.')}</li>
                                <li>{t('organization.terms4', 'Chịu trách nhiệm về nội dung và chất lượng sự kiện.')}</li>
                                <li>{t('organization.terms5', 'Tuân thủ chính sách hoàn tiền và bảo vệ người tiêu dùng.')}</li>
                            </ul>

                            <h3 className="font-semibold text-gray-900 dark:text-white pt-2">
                                {t('organization.termsTitle2', '2. Chính sách phí và thanh toán')}
                            </h3>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>{t('organization.terms6', 'Phí nền tảng: 5% trên mỗi giao dịch thành công.')}</li>
                                <li>{t('organization.terms7', 'Thanh toán doanh thu sau 7 ngày kể từ khi sự kiện kết thúc.')}</li>
                                <li>{t('organization.terms8', 'Yêu cầu cung cấp thông tin ngân hàng chính xác để nhận payout.')}</li>
                            </ul>

                            <h3 className="font-semibold text-gray-900 dark:text-white pt-2">
                                {t('organization.termsTitle3', '3. Quyền và trách nhiệm')}
                            </h3>
                            <ul className="list-disc list-inside space-y-1 pl-2">
                                <li>{t('organization.terms9', 'Ticket Crate có quyền tạm ngưng hoặc hủy tổ chức vi phạm điều khoản.')}</li>
                                <li>{t('organization.terms10', 'Tổ chức chịu trách nhiệm giải quyết tranh chấp với khách hàng.')}</li>
                                <li>{t('organization.terms11', 'Bảo mật thông tin khách hàng theo quy định pháp luật.')}</li>
                            </ul>
                        </div>

                        <div className="flex items-start space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <Checkbox
                                id="terms"
                                checked={acceptedTerms}
                                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                                className="mt-0.5"
                            />
                            <Label
                                htmlFor="terms"
                                className="text-sm font-medium leading-relaxed cursor-pointer"
                            >
                                {t('organization.termsAccept', 'Tôi đã đọc, hiểu và đồng ý với các Điều khoản và Điều kiện nêu trên.')}
                            </Label>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowTermsDialog(false)}>
                            {t('common.cancel', 'Hủy')}
                        </Button>
                        <Button
                            onClick={handleConfirmCreate}
                            disabled={!acceptedTerms}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {t('organization.confirmCreate', 'Xác nhận tạo tổ chức')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CreateOrganization;
