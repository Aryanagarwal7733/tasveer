/**
 * ==========================================================================
 * Tasveer by Prince Studio - Specialty Products Catalog Module (js/catalog-other.js)
 * Dedicated, lightweight data file for Gallery sets, Posters, Mugs, Stickers, Lights, Boxes
 * ==========================================================================
 */

(function (window) {
    'use strict';

    const OTHER_PRODUCTS_DATA = [
        { 
            id: 'p_gal_1', 
            title: 'Stairway Museum Gallery Set of 6', 
            name: 'Stairway Museum Gallery Set of 6', 
            category: 'cat_gallery_frames', 
            price: 1899, 
            basePrice: 1899, 
            originalPrice: 2999, 
            rating: 5.0, 
            reviews: 52, 
            badge: 'Complete Set', 
            stock: 8, 
            image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=500', 
            desc: 'Pre-designed 6-frame grid layout with hanging stencil template.',
            sizes: [
                { name: '6-Frame Standard Set', price: 1899 },
                { name: '8-Frame Grand Set', price: 2499 }
            ]
        },
        { 
            id: 'p_pos_1', 
            title: 'Custom HD Wall Poster (12x18")', 
            name: 'Custom HD Wall Poster (12x18")', 
            category: 'cat_poster_frames', 
            price: 149, 
            basePrice: 149, 
            originalPrice: 249, 
            rating: 4.9, 
            reviews: 42, 
            badge: 'Best Seller', 
            stock: 50, 
            image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=500', 
            desc: '300 GSM matte poster paper with non-fade HD color printing.',
            sizes: [
                { name: '12x18"', price: 149 },
                { name: '18x24"', price: 249 },
                { name: '24x36"', price: 449 }
            ]
        },
        { 
            id: 'p_mug_1', 
            title: 'Magic Heat-Reveal Photo Mug (11oz)', 
            name: 'Magic Heat-Reveal Photo Mug (11oz)', 
            category: 'cat_mug_prints', 
            price: 299, 
            basePrice: 299, 
            originalPrice: 499, 
            rating: 5.0, 
            reviews: 76, 
            badge: 'Magic Gift', 
            stock: 60, 
            image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500', 
            desc: 'Black mug reveals your custom photo when hot liquid is poured in!',
            sizes: [
                { name: 'Standard 11oz', price: 299 },
                { name: 'Large 15oz', price: 399 }
            ]
        },
        { 
            id: 'p_stk_1', 
            title: 'Waterproof Die-Cut Vinyl Stickers (Set of 10)', 
            name: 'Waterproof Die-Cut Vinyl Stickers (Set of 10)', 
            category: 'cat_sticker_prints', 
            price: 149, 
            basePrice: 149, 
            originalPrice: 299, 
            rating: 4.9, 
            reviews: 63, 
            badge: 'Waterproof', 
            stock: 150, 
            image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500', 
            desc: 'Custom photo stickers with scratch-resistant matte vinyl coating.',
            sizes: [
                { name: 'Set of 10 Stickers', price: 149 },
                { name: 'Set of 25 Stickers', price: 249 },
                { name: 'Set of 50 Stickers', price: 449 }
            ]
        },
        { 
            id: 'p_lgt_1', 
            title: 'Glowing LED Backlit Acrylic Light Frame (12x18")', 
            name: 'Glowing LED Backlit Acrylic Light Frame (12x18")', 
            category: 'cat_light_frames', 
            price: 999, 
            basePrice: 999, 
            originalPrice: 1599, 
            rating: 5.0, 
            reviews: 84, 
            badge: 'Glowing LED', 
            stock: 15, 
            image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop', 
            desc: 'Warm LED backlighting creates a magical glowing night light frame.',
            sizes: [
                { name: '8x12" Light Frame', price: 799 },
                { name: '12x18" Light Frame', price: 999 },
                { name: '16x24" Light Frame', price: 1499 }
            ]
        },
        { 
            id: 'p_box_1', 
            title: 'Deep 3D Memory Shadow Box Frame (10x10")', 
            name: 'Deep 3D Memory Shadow Box Frame (10x10")', 
            category: 'cat_box_frames', 
            price: 699, 
            basePrice: 699, 
            originalPrice: 1099, 
            rating: 5.0, 
            reviews: 49, 
            badge: '3D Memory', 
            stock: 18, 
            image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500', 
            desc: 'Extra deep shadow box frame for souvenirs & 3D photos.',
            sizes: [
                { name: '8x8" Shadow Box', price: 549 },
                { name: '10x10" Shadow Box', price: 699 },
                { name: '12x12" Shadow Box', price: 899 }
            ]
        }
    ];

    window.OTHER_PRODUCTS_CATALOG = OTHER_PRODUCTS_DATA;

})(window);
