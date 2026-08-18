import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './MonthlyWaveChart.css';

const MonthlyWaveChart = ({ data, title }) => {
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e8e8e8'
                }}>
                    <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#1a1a2e', fontSize: '12px' }}>
                        {label}
                    </p>
                    {payload.map((item, index) => (
                        <p key={index} style={{ 
                            margin: '2px 0', 
                            color: item.color,
                            fontSize: '12px'
                        }}>
                            {item.name}: ${item.value.toFixed(2)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (!data || data.length === 0) {
        return (
            <div className="monthly-wave-chart">
                <div className="no-data-message">
                    <p>No data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="monthly-wave-chart">
            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                    >
                        <defs>
                            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#28a745" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#28a745" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#dc3545" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#dc3545" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" vertical={false} />
                        <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 11, fill: '#888' }}
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                        />
                        <YAxis 
                            tick={{ fontSize: 11, fill: '#888' }}
                            tickFormatter={(value) => `$${value}`}
                            tickLine={false}
                            axisLine={false}
                            width={50}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            iconType="circle"
                            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                            verticalAlign="bottom"
                            height={36}
                        />
                        <Area
                            type="monotone"
                            dataKey="income"
                            name="Income"
                            stroke="#28a745"
                            strokeWidth={2.5}
                            fill="url(#incomeGradient)"
                            dot={{ 
                                fill: '#28a745', 
                                r: 4, 
                                strokeWidth: 2,
                                stroke: '#fff'
                            }}
                            activeDot={{ r: 6, stroke: '#28a745', strokeWidth: 2 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="expenses"
                            name="Expenses"
                            stroke="#dc3545"
                            strokeWidth={2.5}
                            fill="url(#expenseGradient)"
                            dot={{ 
                                fill: '#dc3545', 
                                r: 4, 
                                strokeWidth: 2,
                                stroke: '#fff'
                            }}
                            activeDot={{ r: 6, stroke: '#dc3545', strokeWidth: 2 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="savings"
                            name="Savings"
                            stroke="#667eea"
                            strokeWidth={2.5}
                            fill="url(#savingsGradient)"
                            dot={{ 
                                fill: '#667eea', 
                                r: 4, 
                                strokeWidth: 2,
                                stroke: '#fff'
                            }}
                            activeDot={{ r: 6, stroke: '#667eea', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MonthlyWaveChart;