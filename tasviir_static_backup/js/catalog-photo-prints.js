/**
 * ==========================================================================
 * Tasveer by Prince Studio - Photo Prints Catalog Module (js/catalog-photo-prints.js)
 * Dedicated, lightweight data file for all Photo Printing products & sizes
 * ==========================================================================
 */

(function (window) {
    'use strict';

    const PHOTO_PRINTS_DATA = [
        { 
            id: 'prod_pp_1', 
            title: 'Passport Size Photos (Set of 8 / 16 / 32)', 
            name: 'Passport Size Photos (Set of 8 / 16 / 32)', 
            category: 'cat_photo_prints', 
            price: 49, 
            basePrice: 49, 
            originalPrice: 99, 
            desc: 'Studio standard 35x45mm passport & visa photos with white/blue background and precision die-cut.', 
            badge: 'Studio Urgent', 
            image: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=600&auto=format&fit=crop', 
            stock: 100, 
            rating: 5.0, 
            reviews: 64, 
            sizes: [
                { name: 'Set of 8 Photos', price: 49 },
                { name: 'Set of 16 Photos', price: 89 },
                { name: 'Set of 32 Photos', price: 149 }
            ] 
        },
        { 
            id: 'prod_pp_2', 
            title: 'Postcard & Table Photo Prints (4x6, 5x7, 6x8)', 
            name: 'Postcard & Table Photo Prints (4x6, 5x7, 6x8)', 
            category: 'cat_photo_prints', 
            price: 19, 
            basePrice: 19, 
            originalPrice: 49, 
            desc: 'Pocket & album size vibrant lab prints on 300GSM premium glossy or matte photo sheet.', 
            badge: 'Popular Album', 
            image: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=600&auto=format&fit=crop', 
            stock: 150, 
            rating: 4.9, 
            reviews: 82, 
            sizes: [
                { name: '4x6" Postcard', price: 19 },
                { name: '5x7" Medium', price: 39 },
                { name: '6x8" Large', price: 59 }
            ] 
        },
        { 
            id: 'prod_pp_3', 
            title: 'A4 / 8x12 Studio HD Photo Print', 
            name: 'A4 / 8x12 Studio HD Photo Print', 
            category: 'cat_photo_prints', 
            price: 99, 
            basePrice: 99, 
            originalPrice: 199, 
            desc: 'Standard A4 document & 8x12" studio portrait lab print with 12-color archival pigment depth.', 
            badge: 'Bestseller', 
            image: 'https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=600&auto=format&fit=crop', 
            stock: 120, 
            rating: 5.0, 
            reviews: 94, 
            sizes: [
                { name: 'A4 Size (8.3x11.7")', price: 99 },
                { name: '8x12" Studio Standard', price: 99 },
                { name: '8x10" Portrait', price: 89 }
            ] 
        },
        { 
            id: 'prod_pp_4', 
            title: '12x18 Popular Wall Photo Print', 
            name: '12x18 Popular Wall Photo Print', 
            category: 'cat_photo_prints', 
            price: 199, 
            basePrice: 199, 
            originalPrice: 399, 
            desc: 'The most popular wall display print size in India. Non-fade archival colors for home decor.', 
            badge: 'Most Popular', 
            image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop', 
            stock: 90, 
            rating: 4.9, 
            reviews: 110, 
            sizes: [
                { name: '12x18" Wall Poster', price: 199 },
                { name: '12x15" Standard', price: 179 },
                { name: '10x15" Medium', price: 149 }
            ] 
        },
        { 
            id: 'prod_pp_5', 
            title: 'Custom Large Size Photo Print (16x20 to 30x40 & Custom)', 
            name: 'Custom Large Size Photo Print (16x20 to 30x40 & Custom)', 
            category: 'cat_photo_prints', 
            price: 299, 
            basePrice: 299, 
            originalPrice: 599, 
            desc: 'Large wall art prints from 16x20" up to 30x40", or enter your exact custom width and height.', 
            badge: 'Custom Size', 
            image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop', 
            stock: 60, 
            rating: 5.0, 
            reviews: 47, 
            sizes: [
                { name: '16x20"', price: 299 },
                { name: '18x24"', price: 399 },
                { name: '20x30"', price: 499 },
                { name: '24x36"', price: 699 },
                { name: '30x40"', price: 999 },
                { name: 'Custom Size (User Defined)', price: 499, isCustom: true }
            ] 
        },
        { 
            id: 'prod_pp_6', 
            title: 'Mega Large Format Exhibition Prints (36x48 to 44x100)', 
            name: 'Mega Large Format Exhibition Prints (36x48 to 44x100)', 
            category: 'cat_photo_prints', 
            price: 1499, 
            basePrice: 1499, 
            originalPrice: 2999, 
            desc: 'Commercial plotter ultra-large prints for exhibitions, backdrops, wedding banners and showroom walls.', 
            badge: 'Mega Plotter', 
            image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop', 
            stock: 40, 
            rating: 5.0, 
            reviews: 28, 
            sizes: [
                { name: '36x48"', price: 1499 },
                { name: '40x60"', price: 1999 },
                { name: '44x60"', price: 2499 },
                { name: '44x80"', price: 3299 },
                { name: '44x100"', price: 3999 }
            ] 
        }
    ];

    window.PHOTO_PRINTS_CATALOG = PHOTO_PRINTS_DATA;

})(window);
