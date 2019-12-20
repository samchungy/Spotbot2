// require supertest
const server = require("../server/server").mockapp
const request = require("supertest");
jest.mock('../server/components/spotify-auth/spotifyAuthDAL');
const { getState, storeState, getTokens, storeTokens } = require('../server/components/spotify-auth/spotifyAuthDAL');
jest.mock('../server/components/spotify-api/auth', () => {
    return {
        ...jest.requireActual('../server/components/spotify-api/auth'),
        requestTokens: jest.fn().mockReturnValue(Promise.resolve({access_token: "test", refresh_token: "test2"}))
    }
})

// close the server after each test
afterEach(() => {
    server.close();
});

describe("routes: spotify get auth url", () => {
    storeState.mockReturnValue(Promise.resolve());
    getTokens.mockReturnValue(Promise.resolve({access_token: null, refresh_token: null}));
    test("should respond as expected", async () => {
        const response = await request(server)
            .post("/settings")
            .send({
                token: '6r2mZJdBz8Gb8wSl49SHMABa',
                team_id: 'TRVUTD7DM',
                team_domain: 'test-ly33146',
                channel_id: 'CRU3H4MEC',
                channel_name: 'general',
                user_id: 'URVUTD7UP',
                user_name: 'samchungy',
                command: '/spotbot',
                text: 'auth',
                response_url: 'https://hooks.slack.com/commands/TRVUTD7DM/879226852644/M9zQugHnZCMtXNXwdbYIynmw',
                trigger_id: '881543472007.879979449463.7384c6cf0d2df375824f431f7434df61'
            })
        expect(response.status).toEqual(200);
        expect(response.type).toEqual("text/plain");
        expect(response.text).toEqual("https://accounts.spotify.com/authorize?client_id=e44db70cd63248fbb7325c875eb4e57b&response_type=code&redirect_uri=http://localhost:3000/auth/callback&scope=user-read-recently-played%20user-read-playback-state%20user-modify-playback-state%20playlist-read-collaborative%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20streaming&state=881543472007.879979449463.7384c6cf0d2df375824f431f7434df61");
    });
});


describe("routes: spotify callback", () => {
    getState.mockReturnValue(Promise.resolve("881543472007.879979449463.7384c6cf0d2df375824f431f7434df61"));
    getTokens.mockReturnValue(Promise.resolve({access_token: null, refresh_token: null}));
    
    test("should respond as expected", async () => {
        const response = await request(server)
            .get(`/auth/callback?code=AQA7pSxLEn4CGHkFSJII7x-YlDVYm9T6NiVUtNlooHzpX6vRf0nWdK-4TvZL20zdCxWImDhz62z1Vl09K0BI7FHN7tb9zqt43Gz6S_Kg9VZNl2nvmt_PA8HvYbaQFeQOWhxmfEUMCU9tr6QNW0IDZQzpUZ9sbUq1oKDF2fZCVTEjupSBny0MJTI2LXWPwQst7uSWfbEhC7BwUG84GjxBYBuxZj_twOMaRMw__4RU18l9pjj9GF4dum13AvDpoJg34gwKkGjOYzjZ-HJrvXxLdhnUWGHqzPGBs2ryhJA4olsycf0lMEi-kui0_b4INm07pd5QHOd8HRjgAnPY4kicYMO6baEe8qGhdmEqL22ntHIO-D4qg1nT94ZzFwSbaOIDdoFyUxxsVkA5HPX3gC2GKLi4YROw-bufb7If8q6qHmjTpo0SJCWfPnFHh_b8j23lORb56RtDAigVVw&state=881543472007.879979449463.7384c6cf0d2df375824f431f7434df61`);
        expect(response.status).toEqual(200);
        expect(response.type).toEqual("text/plain");
        expect(response.text).toEqual("Auth Success");
    });
});

describe("routes: spotify callback bad state", () => {
    test("should respond as expected", async () => {
        const response = await request(server)
            .get(`/auth/callback?code=AQA7pSxLEn4CGHkFSJII7x-YlDVYm9T6NiVUtNlooHzpX6vRf0nWdK-4TvZL20zdCxWImDhz62z1Vl09K0BI7FHN7tb9zqt43Gz6S_Kg9VZNl2nvmt_PA8HvYbaQFeQOWhxmfEUMCU9tr6QNW0IDZQzpUZ9sbUq1oKDF2fZCVTEjupSBny0MJTI2LXWPwQst7uSWfbEhC7BwUG84GjxBYBuxZj_twOMaRMw__4RU18l9pjj9GF4dum13AvDpoJg34gwKkGjOYzjZ-HJrvXxLdhnUWGHqzPGBs2ryhJA4olsycf0lMEi-kui0_b4INm07pd5QHOd8HRjgAnPY4kicYMO6baEe8qGhdmEqL22ntHIO-D4qg1nT94ZzFwSbaOIDdoFyUxxsVkA5HPX3gC2GKLi4YROw-bufb7If8q6qHmjTpo0SJCWfPnFHh_b8j23lORb56RtDAigVVw&state=881543472007.879979449463.7384c6cf0d2df375824f431f743`);
        expect(response.status).toEqual(401);
        expect(response.type).toEqual("text/plain");
        expect(response.text).toEqual("Invalid State");
    });
});

// jest.mock('../server/components/spotify-api/auth.js');

// describe("routes: spotify callback", () => {
//     test("should respond as expected", async () => {
//         const response = await request(`http://localhost:3000`)
//             .get(`/auth/callback?code=AQA7pSxLEn4CGHkFSJII7x-YlDVYm9T6NiVUtNlooHzpX6vRf0nWdK-4TvZL20zdCxWImDhz62z1Vl09K0BI7FHN7tb9zqt43Gz6S_Kg9VZNl2nvmt_PA8HvYbaQFeQOWhxmfEUMCU9tr6QNW0IDZQzpUZ9sbUq1oKDF2fZCVTEjupSBny0MJTI2LXWPwQst7uSWfbEhC7BwUG84GjxBYBuxZj_twOMaRMw__4RU18l9pjj9GF4dum13AvDpoJg34gwKkGjOYzjZ-HJrvXxLdhnUWGHqzPGBs2ryhJA4olsycf0lMEi-kui0_b4INm07pd5QHOd8HRjgAnPY4kicYMO6baEe8qGhdmEqL22ntHIO-D4qg1nT94ZzFwSbaOIDdoFyUxxsVkA5HPX3gC2GKLi4YROw-bufb7If8q6qHmjTpo0SJCWfPnFHh_b8j23lORb56RtDAigVVw&state=881543472007.879979449463.7384c6cf0d2df375824f431f743`);
//         expect(response.status).toEqual(401);
//         expect(response.type).toEqual("text/plain");
//         expect(response.text).toEqual("Invalid State");
//     });
// });