import { useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

function ChartComponent({ data, title, dataKey }) {
  const chartRef = useRef(null)

  const chartData = {
    labels: data.map((_, index) => index.toString()),
    datasets: [
      {
        label: title,
        data: data.map(item => item[dataKey]),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
  }

  return <Line ref={chartRef} data={chartData} options={options} />
}

export default ChartComponent