'use client';
import {useEffect,useState} from 'react';
export function ThaiClock(){const [value,setValue]=useState('เวลาไทย');useEffect(()=>{const tick=()=>setValue(new Date().toLocaleTimeString('th-TH',{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit',second:'2-digit'}));tick();const timer=setInterval(tick,1000);return()=>clearInterval(timer);},[]);return <time className="thai-clock">{value} <small>TH</small></time>;}
