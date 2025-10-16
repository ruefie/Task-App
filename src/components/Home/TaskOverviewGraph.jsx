import React, { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';
import styles from '../../styles/Home.module.scss';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Draw a background color inside the actual plotting area
const chartAreaBackground = {
  id: 'chartAreaBg',
  beforeDraw: (chart, _args, opts) => {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    ctx.save();
    ctx.fillStyle = opts?.color || '#fff';
    ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
    ctx.restore();
  }
};
ChartJS.register(chartAreaBackground);

// Helper to read a CSS variable with fallback
const readVar = (name, fb) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb;

function useThemeTokens() {
  const [ping, setPing] = useState(0);

  useEffect(() => {
    // Recompute tokens when the app toggles `data-theme`
    const obs = new MutationObserver(() => setPing((x) => x + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Recompute on system theme changes if user uses "system"
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setPing((x) => x + 1);
    mql.addEventListener('change', onChange);

    return () => {
      obs.disconnect();
      mql.removeEventListener('change', onChange);
    };
  }, []);

  // Read all needed tokens whenever ping changes
  return useMemo(() => {
    const card = readVar('--card', '#fff');
    return {
      text: readVar('--text', '#111827'),
      border: readVar('--border', '#e5e7eb'),
      card,
      chartBg: readVar('--chart-bg', card),
      grid: readVar('--chart-grid', '#e5e7eb'),
      axis: readVar('--chart-axis', '#6b7280'),
      tick: readVar('--chart-tick', '#6b7280'),
      line: readVar('--chart-line', '#2563eb'),
      tooltipBg: card,
      tooltipBorder: readVar('--border', '#e5e7eb'),
    };
  }, [ping]);
}

function TaskOverviewGraph({ tasks }) {
  const tokens = useThemeTokens();

  const now = new Date();
  const completedTasks = tasks.filter(t => t.completed).length;
  const inProgressTasks = tasks.filter(t => !t.completed && t.milestone === "On Going").length;
  const upcomingTasks = tasks.filter(t => {
    const dueDate = new Date(t.due_date);
    return !t.completed && dueDate > now;
  }).length;
  const urgentTasks = tasks.filter(t => t.priority === "Urgent").length;
  const highTasks = tasks.filter(t => t.priority === "High").length;
  const normalTasks = tasks.filter(t => t.priority === "Normal").length;

  const completionRate = tasks.length ? (completedTasks / tasks.length) * 100 : 0;
  const onTimeCompletion = tasks.filter(t => {
    if (!t.completed || !t.completed_at) return false;
    const completedDate = new Date(t.completed_at);
    const dueDate = new Date(t.due_date);
    return completedDate <= dueDate;
  }).length / (completedTasks || 1) * 100;

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: tokens.text },
      },
      title: { display: false, color: tokens.text },
      tooltip: {
        backgroundColor: tokens.tooltipBg,
        borderColor: tokens.tooltipBorder,
        borderWidth: 1,
        titleColor: tokens.text,
        bodyColor: tokens.text,
        footerColor: tokens.text,
      },
      chartAreaBg: { color: tokens.chartBg }
    },
    scales: {
      x: {
        grid: { color: tokens.grid, borderColor: tokens.axis },
        ticks: { color: tokens.tick }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        grid: { color: tokens.grid, borderColor: tokens.axis },
        ticks: { color: tokens.tick, stepSize: 1 }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: { drawOnChartArea: false, color: tokens.grid, borderColor: tokens.axis },
        ticks: { color: tokens.tick, callback: (v) => `${v}%` }
      },
    }
  }), [tokens]);

  const data = useMemo(() => ({
    labels: ['Total', 'Completed', 'In Progress', 'Upcoming'],
    datasets: [
      {
        type: 'bar',
        label: 'Task Count',
        data: [tasks.length, completedTasks, inProgressTasks, upcomingTasks],
        backgroundColor: [
          'rgba(59, 130, 246, 0.5)',  // blue
          'rgba(16, 185, 129, 0.5)',  // green
          'rgba(245, 158, 11, 0.5)',  // yellow
          'rgba(99, 102, 241, 0.5)'   // indigo
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(99, 102, 241)'
        ],
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: 'Completion Rate',
        data: [completionRate, completionRate, completionRate, completionRate],
        borderColor: 'rgb(244, 63, 94)',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      },
      {
        type: 'line',
        label: 'On-time Rate',
        data: [onTimeCompletion, onTimeCompletion, onTimeCompletion, onTimeCompletion],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
      }
    ]
  }), [tasks, completedTasks, inProgressTasks, upcomingTasks, completionRate, onTimeCompletion]);

  const priorityData = useMemo(() => ({
    labels: ['Urgent', 'High', 'Normal'],
    datasets: [{
      data: [urgentTasks, highTasks, normalTasks],
      backgroundColor: [
        'rgba(239, 68, 68, 0.5)',   // red
        'rgba(245, 158, 11, 0.5)',  // yellow
        'rgba(59, 130, 246, 0.5)',  // blue
      ],
      borderColor: [
        'rgb(239, 68, 68)',
        'rgb(245, 158, 11)',
        'rgb(59, 130, 246)',
      ],
      borderWidth: 1
    }]
  }), [urgentTasks, highTasks, normalTasks]);

  return (
    <div className={styles.graphContainer}>
      <div className={styles.graphGrid}>
        <div className={styles.mainGraph}>
          <h3 className={styles.graphTitle}>Tasks Overview &amp; Performance</h3>
          <div className={styles.graph}>
            <Bar options={options} data={data} height={300} />
          </div>
        </div>
        <div className={styles.sideGraph}>
          <h3 className={styles.graphTitle}>Priority Distribution</h3>
          <div className={styles.graph}>
            <Pie
              data={priorityData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { color: tokens.text } },
                  chartAreaBg: { color: tokens.chartBg }
                }
              }}
              height={200}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskOverviewGraph;
