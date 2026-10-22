import * as d3 from 'd3';
import { markets } from '../../config/markets.js';
import { history } from '../data.js';
import { byId, el, setText } from '../dom.js';
import { formatLevel } from '../format.js';
import type { ViewState } from '../state.js';

const TREND_KEYS = ['gold', 'silver', 'gs_ratio', 'us10y', 'usdjpy', 'brent', 'gdx', 'nasdaq'];
const HEIGHT = 64;
const PAD = 5;
const SHOW_POINTS_UP_TO = 12;

interface Point {
  date: Date;
  value: number;
  latest: boolean;
}

export function renderTrends(state: ViewState): void {
  const grid = byId('trends-grid');
  grid.replaceChildren();
  let drawn = 0;
  for (const key of TREND_KEYS) {
    const points = trendPoints(key, state);
    if (points.length < 2) continue;
    drawSpark(grid, key, points);
    drawn++;
  }
  setText('trends-note', drawn
    ? 'One point per update, plus today’s latest reading; hover a line for its values'
    : 'Trend lines appear once two or more updates have been saved.');
}

function trendPoints(key: string, state: ViewState): Point[] {
  const saved = history
    .map((row) => ({ date: new Date(row.date + 'T12:00:00Z'), value: Number(row[key]), latest: false }))
    .filter((point) => Number.isFinite(point.value));
  const reading = state.readings.get(key);
  const lastSaved = saved.at(-1);
  if (reading && (!lastSaved || reading.asOf.slice(0, 10) > lastSaved.date.toISOString().slice(0, 10))) {
    saved.push({ date: new Date(reading.asOf), value: reading.value, latest: true });
  }
  return saved;
}

function drawSpark(grid: HTMLElement, key: string, points: Point[]): void {
  const market = markets.find((candidate) => candidate.key === key)!;
  const format = (value: number) => formatLevel(value, market.format);
  const last = el('div', 'last', format(points.at(-1)!.value));
  const card = el('div', 'spark', el('h3', undefined, market.label), last);
  card.id = `trend-${key}`;
  grid.append(card);

  const width = card.clientWidth || 220;
  const x = d3.scaleUtc(d3.extent(points, (point) => point.date) as [Date, Date], [PAD, width - PAD]);
  const [low, high] = d3.extent(points, (point) => point.value) as [number, number];
  const y = d3.scaleLinear(low === high ? [low - 1, high + 1] : [low, high], [HEIGHT - PAD, PAD]);

  const svg = d3.select(card).append('svg').attr('width', '100%').attr('height', HEIGHT).attr('viewBox', `0 0 ${width} ${HEIGHT}`).attr('role', 'img')
    .attr('aria-label', `${market.label} across ${points.length} updates, latest ${format(points.at(-1)!.value)}`);
  svg.append('path').datum(points).attr('fill', 'none').attr('stroke', 'var(--series)').attr('stroke-width', 2)
    .attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round')
    .attr('d', d3.line<Point>().x((point) => x(point.date)).y((point) => y(point.value)));
  if (points.length <= SHOW_POINTS_UP_TO) {
    svg.selectAll('circle.pt').data(points).join('circle').attr('class', 'pt').attr('r', 3)
      .attr('cx', (point) => x(point.date)).attr('cy', (point) => y(point.value)).attr('fill', 'var(--series)');
  }

  const focus = svg.append('circle').attr('r', 4).attr('fill', 'var(--series)').attr('stroke', 'var(--panel)').attr('stroke-width', 2).style('display', 'none');
  const tip = el('div', 'tip');
  card.append(tip);
  svg.append('rect').attr('width', width).attr('height', HEIGHT).attr('fill', 'transparent')
    .on('pointermove', (event: PointerEvent) => {
      const [pointerX] = d3.pointer(event);
      const point = points[d3.leastIndex(points, (candidate) => Math.abs(x(candidate.date) - pointerX)) ?? 0];
      focus.style('display', null).attr('cx', x(point.date)).attr('cy', y(point.value));
      const dateLabel = d3.utcFormat('%b %-d')(point.date) + (point.latest ? ' (latest)' : '');
      tip.replaceChildren(el('div', 'date', dateLabel), el('div', undefined, format(point.value)));
      tip.style.display = 'block';
      const pixelX = (x(point.date) / width) * card.clientWidth;
      tip.style.left = Math.max(0, Math.min(card.clientWidth - tip.offsetWidth, pixelX - tip.offsetWidth / 2)) + 'px';
      tip.style.top = last.offsetTop + last.offsetHeight + 'px';
    })
    .on('pointerleave', () => {
      focus.style('display', 'none');
      tip.style.display = 'none';
    });
}
