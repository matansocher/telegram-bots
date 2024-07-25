import axios from 'axios';
import woltConfig from './wolt.config';
import * as utilsService from '../utils.service';
import LoggerService from '../logger.service';
const logger = new LoggerService(module.filename);

let restaurantsList = {
    restaurants: [],
    lastUpdated: 0,
};

export function getRestaurants() {
    return restaurantsList.restaurants;
}

export function getLastUpdated() {
    return restaurantsList.lastUpdated;
}

export async function refreshRestaurants() {
    try {
        const restaurants = await getRestaurantsList();
        if (restaurants.length) {
            restaurantsList = { restaurants, lastUpdated: new Date().getTime() };
            logger.info(refreshRestaurants.name, 'Restaurants list was refreshed successfully');
        }
    } catch (err) {
        logger.error(refreshRestaurants.name, `error - ${utilsService.getErrorMessage(err)}`);
    }
}

async function getRestaurantsList() {
    try {
        const cities = await getCitiesList();
        const promises = cities.map(city => {
            const { LAT, LON } = city;
            const url = `${woltConfig.RESTAURANTS_BASE_URL}?lat=${LAT}&lon=${LON}`;
            return axios.get(url);
        });

        const response = await Promise.all(promises);
        const restaurantsWithArea = addAreaToRestaurantsFromResponse(response, cities);

        return restaurantsWithArea.map(restaurant => {
            return {
                id: restaurant.venue.id,
                name: restaurant.title,
                isOnline: restaurant.venue.online,
                slug: restaurant.venue.slug,
                area: restaurant.area,
                photo: restaurant.image.url,
            };
        });
    } catch (err) {
        logger.error(getRestaurantsList.name, `err - ${utilsService.getErrorMessage(err)}`);
        return [];
    }
}

async function getCitiesList() {
    try {
        const result = await axios.get(woltConfig.CITIES_BASE_URL);
        const rawCities = result.data.results;
        return rawCities
            .filter(city => woltConfig.CITIES_SLUGS_SUPPORTED.includes(city.slug))
            .map(city => {
                return {
                    WOLT_NAME: city.slug,
                    LON: city.location.coordinates[0],
                    LAT: city.location.coordinates[1],
                };
            });
    } catch (err) {
        logger.error(getCitiesList.name, `err - ${utilsService.getErrorMessage(err)}`);
        return [];
    }

}

function addAreaToRestaurantsFromResponse(response, cities) {
    return response.map((res, index) => {
        const restaurants = res.data.sections[1].items;
        restaurants.map(restaurant => restaurant.area = cities[index].WOLT_NAME);
        return restaurants;
    }).flat();
}

export async function enrichRestaurants(parsedRestaurants) {
    try {
        const promises = parsedRestaurants.map(restaurant => {
            const url = `${woltConfig.RESTAURANT_BASE_URL}`.replace('{slug}', restaurant.slug);
            return axios.get(url);
        });
        const response = await Promise.all(promises);
        const restaurantsRawData = response.map(res => res.data);
        return restaurantsRawData.map((rawRestaurant) => {
            const relevantParsedRestaurant = parsedRestaurants.find(restaurant => restaurant.id === rawRestaurant.venue.id);
            const restaurantLinkUrl = getRestaurantLink(relevantParsedRestaurant);
            const isOpen = rawRestaurant.venue.open_status.is_open;
            return { ...relevantParsedRestaurant, restaurantLinkUrl, isOpen };
        });
    } catch (err) {
        logger.error(enrichRestaurants.name, `err - ${utilsService.getErrorMessage(err)}`);
        return parsedRestaurants;
    }
}

export function getRestaurantLink(restaurant) {
    const { area, slug } = restaurant;
    return woltConfig.RESTAURANT_LINK_BASE_URL.replace('{area}', area).replace('{slug}', slug);
}
