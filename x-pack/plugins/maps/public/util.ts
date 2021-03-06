/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import { EMSClient, FileLayer, TMSService } from '@elastic/ems-client';
import { FeatureCollection } from 'geojson';
// @ts-expect-error
import * as topojson from 'topojson-client';
import _ from 'lodash';

import fetch from 'node-fetch';
import {
  GIS_API_PATH,
  EMS_FILES_CATALOGUE_PATH,
  EMS_TILES_CATALOGUE_PATH,
  EMS_GLYPHS_PATH,
  EMS_APP_NAME,
  FONTS_API_PATH,
  FORMAT_TYPE,
} from '../common/constants';
import {
  getHttp,
  getRegionmapLayers,
  getTilemap,
  getKibanaVersion,
  getEMSSettings,
} from './kibana_services';
import { getLicenseId } from './licensed_features';
import { LayerConfig } from '../../../../src/plugins/maps_ems/public';

export function getKibanaRegionList(): LayerConfig[] {
  return getRegionmapLayers();
}

export function getKibanaTileMap(): unknown {
  return getTilemap();
}

export async function getEmsFileLayers(): Promise<FileLayer[]> {
  if (!getEMSSettings().isEMSEnabled()) {
    return [];
  }

  return getEMSClient().getFileLayers();
}

export async function getEmsTmsServices(): Promise<TMSService[]> {
  if (!getEMSSettings().isEMSEnabled()) {
    return [];
  }

  return getEMSClient().getTMSServices();
}

function relativeToAbsolute(url: string): string {
  const a = document.createElement('a');
  a.setAttribute('href', url);
  return a.href;
}

let emsClient: EMSClient | null = null;
let latestLicenseId: string | undefined;
export function getEMSClient(): EMSClient {
  if (!emsClient) {
    const emsSettings = getEMSSettings();
    const proxyPath = '';
    const tileApiUrl = emsSettings!.isProxyElasticMapsServiceInMaps()
      ? relativeToAbsolute(
          getHttp().basePath.prepend(`/${GIS_API_PATH}/${EMS_TILES_CATALOGUE_PATH}`)
        )
      : emsSettings!.getEMSTileApiUrl();
    const fileApiUrl = emsSettings!.isProxyElasticMapsServiceInMaps()
      ? relativeToAbsolute(
          getHttp().basePath.prepend(`/${GIS_API_PATH}/${EMS_FILES_CATALOGUE_PATH}`)
        )
      : emsSettings!.getEMSFileApiUrl();

    emsClient = new EMSClient({
      language: i18n.getLocale(),
      appVersion: getKibanaVersion(),
      appName: EMS_APP_NAME,
      tileApiUrl,
      fileApiUrl,
      landingPageUrl: emsSettings!.getEMSLandingPageUrl(),
      fetchFunction(url: string) {
        return fetch(url);
      },
      proxyPath,
    });
  }
  const licenseId = getLicenseId();
  if (latestLicenseId !== licenseId) {
    latestLicenseId = licenseId;
    emsClient.addQueryParams({ license: licenseId ? licenseId : '' });
  }
  return emsClient;
}

export function getGlyphUrl(): string {
  const emsSettings = getEMSSettings();
  if (!emsSettings!.isEMSEnabled()) {
    return getHttp().basePath.prepend(`/${FONTS_API_PATH}/{fontstack}/{range}`);
  }

  return emsSettings!.isProxyElasticMapsServiceInMaps()
    ? relativeToAbsolute(
        getHttp().basePath.prepend(
          `/${GIS_API_PATH}/${EMS_TILES_CATALOGUE_PATH}/${EMS_GLYPHS_PATH}`
        )
      ) + `/{fontstack}/{range}`
    : emsSettings!.getEMSFontLibraryUrl();
}

export function isRetina(): boolean {
  return window.devicePixelRatio === 2;
}

export async function fetchGeoJson(
  fetchUrl: string,
  format: FORMAT_TYPE,
  featureCollectionPath: string
): Promise<FeatureCollection> {
  let fetchedJson;
  try {
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error('Request failed');
    }
    fetchedJson = await response.json();
  } catch (e) {
    throw new Error(
      i18n.translate('xpack.maps.util.requestFailedErrorMessage', {
        defaultMessage: `Unable to fetch vector shapes from url: {fetchUrl}`,
        values: { fetchUrl },
      })
    );
  }

  if (format === FORMAT_TYPE.GEOJSON) {
    return fetchedJson;
  }

  if (format === FORMAT_TYPE.TOPOJSON) {
    const features = _.get(fetchedJson, `objects.${featureCollectionPath}`);
    return topojson.feature(fetchedJson, features);
  }

  throw new Error(
    i18n.translate('xpack.maps.util.formatErrorMessage', {
      defaultMessage: `Unable to fetch vector shapes from url: {format}`,
      values: { format },
    })
  );
}
