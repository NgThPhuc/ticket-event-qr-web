import { useNavigate } from 'react-router-dom';

// Định nghĩa các địa điểm với hình ảnh và tên thành phố
const locations = [
    {
        id: 'hcm',
        name: 'Tp. Hồ Chí Minh',
        city: 'Hồ Chí Minh',
        image: '/assets/location/hcmcity.jpg',
        color: '#4CAF50'
    },
    {
        id: 'hanoi',
        name: 'Hà Nội',
        city: 'Hà Nội',
        image: '/assets/location/hanoi.jpg',
        color: '#4CAF50'
    },
    {
        id: 'danang',
        name: 'Đà Nẵng',
        city: 'Đà Nẵng',
        image: '/assets/location/danang.jfif',
        color: '#4CAF50'
    },
    {
        id: 'other',
        name: 'Vị trí khác',
        city: '',
        image: '/assets/location/vitrikhac.webp',
        color: '#4CAF50',
        isOther: true
    }
];

/**
 * LocationSection - Section hiển thị các địa điểm để filter events theo city
 */
const LocationSection = () => {
    const navigate = useNavigate();

    const handleLocationClick = (location) => {
        if (location.isOther) {
            // Chuyển đến trang events không filter city
            navigate('/events');
        } else {
            // Chuyển đến trang events với filter city
            navigate(`/events?city=${encodeURIComponent(location.city)}`);
        }
    };

    return (
        <section className="py-8 md:py-12">
            <div className="container mx-auto px-4">
                {/* Header */}
                <h2 className="text-xl font-bold text-foreground mb-6">
                    Điểm đến thú vị
                </h2>

                {/* Location Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {locations.map((location) => (
                        <div
                            key={location.id}
                            onClick={() => handleLocationClick(location)}
                            className="relative overflow-hidden rounded-xl cursor-pointer group aspect-[4/3]"
                        >
                            {/* Background Image */}
                            <img
                                src={location.image}
                                alt={location.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            
                            {/* Overlay gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            
                            {/* City Name */}
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 
                                    className="text-lg md:text-xl font-bold text-white"
                                    style={{ 
                                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                        borderBottom: `3px solid ${location.color}`,
                                        display: 'inline-block',
                                        paddingBottom: '4px'
                                    }}
                                >
                                    {location.name}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LocationSection;
