import React from 'react';
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
import { Pipette } from 'lucide-react';

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

const options = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: false
    }
  },
  scales: {
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      beginAtZero: true,
      grid: {
        drawOnChartArea: false,
      },
      ticks: {
        callback: (value) => `${value}%`
      }
    },
  }
};

function TaskOverviewGraph({ tasks }) {
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

  const data = {
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
  };

  const priorityData = {
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
  };

  return (
    <div className={styles.graphContainer}>
      <div className={styles.graphGrid}>
        <div className={styles.mainGraph}>
          <h3 className={styles.graphTitle}>Tasks Overview & Performance</h3>
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
                  legend: {
                    position: 'bottom',
                  }
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