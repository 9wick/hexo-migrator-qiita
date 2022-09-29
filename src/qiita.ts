import fetch from 'node-fetch-commonjs';

export interface QiitaUser {
  "description": string,
  "facebook_id": string,
  "followees_count": number,
  "followers_count": number,
  "github_login_name": string,
  "id": string,
  "items_count": number,
  "linkedin_id": string,
  "location": string,
  "name": string,
  "organization": string,
  "permanent_id": number,
  "profile_image_url": string,
  "team_only": boolean,
  "twitter_screen_name": null | string,
  "website_url": string,
}

export interface QiitaTag {
  "name": string,
  "versions": any[]
};

export interface QiitaArcicle {
  "rendered_body": string,
  "body": string,
  "coediting": false,
  "comments_count": number,
  "created_at": string, // "2019-12-24T17:21:12+09:00",
  "group": any,
  "id": string, // "16622097b8e6b5758d80",
  "likes_count": number,
  "private": boolean,
  "reactions_count": number,
  "stocks_count": number,
  "tags": QiitaTag[]
  "title": string,
  "updated_at": string,//"2019-12-25T07:00:26+09:00",
  "url": string, //"https://qiita.com/wicket/items/16622097b8e6b5758d80",
  "user": QiitaUser,
  "page_views_count": null | number,
  "team_membership": null | any
};

export interface QiitaError {
  "message": "Not found",
  "type": "not_found"
}

export const getQiitaJson = async (username: string) => {

  const results: QiitaArcicle[] = [];

  for (let page = 1; page < 10000; page++) { // maybe list < 100000
    const url = `https://qiita.com/api/v2/users/${username}/items?page=${page}`
    const res = await fetch(url);
    const json = await res.json() as QiitaArcicle[] | QiitaError;

    if ("type" in json) {
      throw `Qiita api error. Maybe userId: ${username} not found`;
    }
    if (json.length === 0) {
      break;
    }
    results.push(...json);
  }

  return results;
}