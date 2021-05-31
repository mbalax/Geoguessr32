jest.mock('@/plugins/axios', () => {
    const responseTls = {
        geometry: {
            coordinates: [1.4455249, 43.5271458],
            type: 'Point',
        },
        type: 'Feature',
        properties: {
            osm_id: 158980,
            osm_type: 'R',
            extent: [1.4202811, 43.546134, 1.4534675, 43.5126463],
            country: 'France',
            osm_key: 'place',
            osm_value: 'village',
            postcode: '31320',
            name: 'Vieille-Toulouse',
            state: 'Occitania',
        },
    };
    return {
        get: jest.fn((url) => {
            let data;

            switch (url) {
                case 'https://map.geojson':
                    data = responseTls;
                    break;
                case 'https://listmaps.gejson':
                    data = { maps: [] };
                    break;
            }

            return Promise.resolve({
                status: 200,
                data,
            });
        }),
    };
});

import axios from '@/plugins/axios';
import * as MutationTypes from '../../../src/store/mutation-types';
const { default: homeStore } = require('../../../src/store/homeStore');

describe('homeStore.js', () => {
    //
    // MUTATIONS
    //
    it('mutations', () => {
        const state = homeStore.state();
        expect(state.geojson).toBeNull();
        const geojson = {
            type: 'Point',
        };
        homeStore.mutations[MutationTypes.HOME_SET_GEOJSON](state, geojson);

        expect(state.geojson).toEqual(geojson);

        expect(state.listMaps).toHaveLength(0);
        homeStore.mutations[MutationTypes.HOME_SET_LISTMAPS](state, [
            { name: 'Hello' },
        ]);
        expect(state.listMaps).toHaveLength(1);

        expect(state.openDialogSinglePlayer).toEqual(false);
        homeStore.mutations[MutationTypes.HOME_SET_SINGLEPLAYER](state, true);

        expect(state.openDialogSinglePlayer).toEqual(true);

        expect(state.openDialogMultiPlayer).toEqual(false);
        homeStore.mutations[MutationTypes.HOME_SET_MULTIPLAYER](state, true);
        expect(state.openDialogMultiPlayer).toEqual(true);

        expect(state).toMatchSnapshot();
    });

    //
    // GETTERS
    //
    it('isValidGeoJson expect FeatureCollection', () => {
        const state = {
            geojson: {
                geometry: {
                    coordinates: [1.4442469, 43.6044622],
                    type: 'Point',
                },
                type: 'Feature',
            },
        };
        expect(homeStore.getters.isValidGeoJson(state)).toEqual(false);
    });
    it('isValidGeoJson expect features', () => {
        const state = {
            geojson: {
                type: 'FeatureCollection',
            },
        };
        expect(homeStore.getters.isValidGeoJson(state)).toEqual(false);
    });
    it('isValidGeoJson expect not Circle', () => {
        const state = {
            geojson: {
                type: 'FeatureCollection',
                features: [
                    {
                        geometry: {
                            coordinates: [1.4442469, 43.6044622],
                            type: 'Circle',
                        },
                        type: 'Feature',
                    },
                ],
            },
        };
        expect(homeStore.getters.isValidGeoJson(state)).toEqual(false);
    });
    it('isValidGeoJson true', () => {
        const state = {
            geojson: {
                type: 'FeatureCollection',
                features: [
                    {
                        geometry: {
                            coordinates: [1.4442469, 43.6044622],
                            type: 'Point',
                        },
                        type: 'Feature',
                    },
                ],
            },
        };
        expect(homeStore.getters.isValidGeoJson(state)).toEqual(true);
        const obj = homeStore.getters.geoJson(state);
        expect(obj.type).toEqual('FeatureCollection');
        expect(obj.features).toHaveLength(1);
        expect(obj).toMatchSnapshot();
        const objString = homeStore.getters.geoJsonString(state);
        expect(objString).toContain('FeatureCollection');
        expect(objString).toMatchSnapshot();

        expect(homeStore.getters.geoJsonString({})).toEqual('');
    });

    //
    // ACTIONS
    //

    it('loadGeoJsonFromUrl', async () => {
        const commit = jest.fn();
        await homeStore.actions.loadGeoJsonFromUrl(
            { commit },
            'https://map.geojson'
        );
        expect(axios.get).toBeCalledWith('https://map.geojson');

        await homeStore.actions.loadGeoJsonFromUrl(
            { commit },
            'https://gist.github.com/BilelJegham/7f855024440c67d65f24536c9215719e'
        );

        expect(axios.get).toBeCalledWith(
            'https://gist.githubusercontent.com/BilelJegham/7f855024440c67d65f24536c9215719e/raw'
        );

        expect(commit).toBeCalledWith(
            MutationTypes.HOME_SET_GEOJSON,
            expect.anything()
        );
    });

    it('setGeoJsonString', () => {
        const commit = jest.fn();
        homeStore.actions.setGeoJsonString({ commit }, '');
        expect(commit).toBeCalledWith(MutationTypes.HOME_SET_GEOJSON, null);

        const obj = '{"type": "Feature"}';
        homeStore.actions.setGeoJsonString({ commit }, obj);

        expect(commit).toBeCalledWith(
            MutationTypes.HOME_SET_GEOJSON,
            JSON.parse(obj)
        );
    });

    it('setGeoJson', () => {
        const commit = jest.fn();
        const obj = { type: 'Feature' };
        homeStore.actions.setGeoJson({ commit }, obj);

        expect(commit).toBeCalledWith(MutationTypes.HOME_SET_GEOJSON, obj);
    });

    it('getListMaps', async () => {
        const commit = jest.fn();

        process.env.VUE_APP_LIST_MAPS_JSON_URL = 'https://listmaps.gejson';

        await homeStore.actions.getListMaps({ commit });
        expect(axios.get).toBeCalledWith(
            'https://listmaps.gejson',
            expect.any(Object)
        );

        expect(commit).toBeCalledWith(
            MutationTypes.HOME_SET_LISTMAPS,
            expect.any(Array)
        );
    });

    it('playSinglePlayer', () => {
        const commit = jest.fn();
        homeStore.actions.playSinglePlayer({ commit });

        expect(commit).toBeCalledWith(
            MutationTypes.HOME_SET_SINGLEPLAYER,
            true
        );
    });
    it('playMultiPlayer', () => {
        const commit = jest.fn();
        homeStore.actions.playMultiPlayer({ commit });

        expect(commit).toBeCalledWith(MutationTypes.HOME_SET_MULTIPLAYER, true);
    });
    it('resetSinglePlayer', () => {
        const commit = jest.fn();
        homeStore.actions.resetSinglePlayer({ commit });

        expect(commit).toBeCalledWith(
            MutationTypes.HOME_SET_SINGLEPLAYER,
            false
        );
    });
    it('resetMultiPlayer', () => {
        const commit = jest.fn();
        homeStore.actions.resetMultiPlayer({ commit });

        expect(commit).toBeCalledWith(
            MutationTypes.HOME_SET_MULTIPLAYER,
            false
        );
    });

    it('loadHistory', () => {
        localStorage.setItem(
            'history',
            '[{"multiplayer":false,"date":"2020-06-14T15:10:14.579Z","timeLimitation":0,"rounds":[{"guess":{"lat":49.35629642234583,"lng":-73.3876235},"position":{"lat":46.32492404792541,"lng":-74.2128121666204},"distance":343031},{"guess":{"lat":20.966226136901,"lng":105.91472350868774},"position":{"lat":16.45610423382063,"lng":107.5978548200058},"distance":532484},{"guess":{"lat":-1.9789104624962186,"lng":-64.70788738160854},"position":{"lat":-8.47747465683049,"lng":-70.14934638834765},"distance":941702},{"guess":{"lat":55.48785435635061,"lng":-1.5939715638887852},"position":{"lat":58.51518485516467,"lng":-6.260475420814613},"distance":439803},{"guess":{"lat":39.96452059424641,"lng":-100.91667319052173},"position":{"lat":42.04582308041186,"lng":-101.0496153025084},"distance":231958}],"score":2488978}]'
        );
        const commit = jest.fn();
        homeStore.actions.loadHistory({ commit });

        expect(commit).toBeCalledWith(
            MutationTypes.HOME_SET_HISTORY,
            expect.anything()
        );
        // expect(homeStore.state.history).toHaveLength(1);
        // expect(homeStore.state.history[0].score).toEqual(2488978);
    });
});
