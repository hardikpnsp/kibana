/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { DataSeries } from '../types';
import { FieldLabels } from './constants';
import { OperationType } from '../../../../../../lens/public';

interface Props {
  seriesId: string;
}

export function getCPUUsageLensConfig({ seriesId }: Props): DataSeries {
  return {
    id: seriesId,
    reportType: 'cpu-usage',
    defaultSeriesType: 'line',
    seriesTypes: ['line', 'bar'],
    xAxisColumn: {
      sourceField: '@timestamp',
    },
    yAxisColumn: {
      operationType: 'avg' as OperationType,
      sourceField: 'system.cpu.user.pct',
      label: 'CPU Usage %',
    },
    hasMetricType: true,
    defaultFilters: [],
    breakdowns: ['host.hostname'],
    filters: [],
    labels: { ...FieldLabels, 'host.hostname': 'Host name' },
    reportDefinitions: [
      {
        field: 'agent.hostname',
        required: true,
      },
    ],
  };
}
