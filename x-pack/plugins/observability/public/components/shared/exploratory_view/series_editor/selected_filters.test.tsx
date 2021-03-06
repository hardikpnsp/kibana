/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { mockIndexPattern, mockUrlStorage, render } from '../rtl_helpers';
import { SelectedFilters } from './selected_filters';
import { getDefaultConfigs } from '../configurations/default_configs';
import { NEW_SERIES_KEY } from '../hooks/use_url_strorage';
import { USER_AGENT_NAME } from '../configurations/data/elasticsearch_fieldnames';

describe('SelectedFilters', function () {
  const dataViewSeries = getDefaultConfigs({
    reportType: 'pld',
    indexPattern: mockIndexPattern,
    seriesId: NEW_SERIES_KEY,
  });

  it('should render properly', async function () {
    mockUrlStorage({ filters: [{ field: USER_AGENT_NAME, values: ['Chrome'] }] });

    render(<SelectedFilters seriesId={'series-id'} series={dataViewSeries} />);

    await waitFor(() => {
      screen.getByText('Chrome');
      screen.getByTitle('Filter: Browser family: Chrome. Select for more filter actions.');
    });
  });
});
