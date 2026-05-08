'use client';

import { useState } from 'react';
import {
  CarInput,
  Drivetrain,
  Transmission,
  TireType,
  PowerType,
  Fuel,
  Aspiration,
  PowertrainType,
  ElectricMotorCount,
  HybridLayout,
} from '@/lib/types';

interface Props {
  label: string;
  value: CarInput;
  onChange: (v: CarInput) => void;
}

export default function CarInputForm({ label, value, onChange }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  function update<K extends keyof CarInput>(key: K, val: CarInput[K]) {
    onChange({ ...value, [key]: val });
  }

  function numericChange(
    key:
      | 'horsepower'
      | 'torque'
      | 'weight'
      | 'zeroToSixty'
      | 'sixtyToOneThirty'
      | 'quarterMile'
      | 'trapSpeed',
    raw: string,
  ) {
    update(key, raw === '' ? '' : Number(raw));
  }

  function yearChange(raw: string) {
    update('year', raw === '' ? '' : Number(raw));
  }

  const inp =
    'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors';
  const sel =
    'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors cursor-pointer';
  const lbl = 'block text-xs font-medium text-zinc-400 mb-1';
  const sectionHead =
    'text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 mt-4 border-b border-zinc-800 pb-1';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h2 className="text-lg font-bold text-orange-500 mb-4">{label}</h2>

      {/* Vehicle */}
      <p className={sectionHead}>Vehicle</p>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>
              Year <span className="text-orange-500">*</span>
            </label>
            <input
              type="number"
              min={1886}
              max={new Date().getFullYear() + 1}
              className={inp}
              placeholder="e.g. 2022"
              value={value.year}
              onChange={(e) => yearChange(e.target.value)}
            />
          </div>
          <div>
            <label className={lbl}>
              Make <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              className={inp}
              placeholder="e.g. Subaru"
              value={value.make}
              onChange={(e) => update('make', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>
              Model <span className="text-orange-500">*</span>
            </label>
            <input
              type="text"
              className={inp}
              placeholder="e.g. WRX"
              value={value.model}
              onChange={(e) => update('model', e.target.value)}
            />
          </div>
          <div>
            <label className={lbl}>Trim</label>
            <input
              type="text"
              className={inp}
              placeholder="e.g. STI, GT500"
              value={value.trim}
              onChange={(e) => update('trim', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Power */}
      <p className={sectionHead}>Power</p>
      <div className="space-y-3">
        {/* Powertrain Type - visible in basic section */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Powertrain Type</label>
            <select
              className={sel}
              value={value.powertrainType ?? 'Unknown'}
              onChange={(e) =>
                update('powertrainType', e.target.value as PowertrainType)
              }
            >
              <option>Unknown</option>
              <option>Gas</option>
              <option>Diesel</option>
              <option>Hybrid</option>
              <option>Electric</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Power Type</label>
            <select
              className={sel}
              value={value.powerType}
              onChange={(e) => update('powerType', e.target.value as PowerType)}
            >
              <option>Wheel HP</option>
              <option>Crank HP</option>
              <option>Estimated HP</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>
              Horsepower <span className="text-orange-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              className={inp}
              placeholder="e.g. 300"
              value={value.horsepower}
              onChange={(e) => numericChange('horsepower', e.target.value)}
            />
          </div>
          <div>
            <label className={lbl}>
              Weight (lbs) <span className="text-orange-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              className={inp}
              placeholder="e.g. 3500"
              value={value.weight}
              onChange={(e) => numericChange('weight', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Drivetrain</label>
            <select
              className={sel}
              value={value.drivetrain}
              onChange={(e) =>
                update('drivetrain', e.target.value as Drivetrain)
              }
            >
              <option>FWD</option>
              <option>RWD</option>
              <option>AWD</option>
              <option>4WD</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Transmission</label>
            <select
              className={sel}
              value={value.transmission}
              onChange={(e) =>
                update('transmission', e.target.value as Transmission)
              }
            >
              <option>Unknown</option>
              <option>Manual</option>
              <option>Auto</option>
              <option>DCT</option>
              <option>Single-speed / EV</option>
              <option>CVT</option>
            </select>
          </div>
        </div>
        <div>
          <label className={lbl}>Tire Type</label>
          <select
            className={sel}
            value={value.tire}
            onChange={(e) => update('tire', e.target.value as TireType)}
          >
            <option>All-season</option>
            <option>Summer</option>
            <option>Performance summer</option>
            <option>Winter</option>
            <option>Drag radial</option>
            <option>Slick</option>
          </select>
        </div>
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="mt-4 w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <span>
          {showAdvanced ? 'Hide advanced fields' : 'Show advanced fields'}
        </span>
        <span className="text-zinc-500">{showAdvanced ? '^' : 'v'}</span>
      </button>

      {/* Advanced / Improve Accuracy */}
      {showAdvanced && (
        <div className="mt-3 space-y-3">
          <p className={sectionHead}>Improve Accuracy</p>

          {/* Torque + Induction (internal prop name kept as aspiration for backward compat) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Torque (lb-ft)</label>
              <input
                type="number"
                min={1}
                className={inp}
                placeholder="e.g. 295"
                value={value.torque}
                onChange={(e) => numericChange('torque', e.target.value)}
              />
            </div>
            <div>
              <label className={lbl}>Induction</label>
              <select
                className={sel}
                value={value.aspiration}
                onChange={(e) =>
                  update('aspiration', e.target.value as Aspiration)
                }
              >
                <option>Unknown</option>
                <option>Naturally aspirated</option>
                <option>Turbo</option>
                <option>Twin-turbo</option>
                <option>Supercharged</option>
                <option>Procharged</option>
                <option>Nitrous</option>
                <option>Electric / None</option>
              </select>
            </div>
          </div>

          {/* Engine Size + Fuel */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Engine Size</label>
              <input
                type="text"
                className={inp}
                placeholder="e.g. 2.0L, 5.0L, EV"
                value={value.engineSize ?? ''}
                onChange={(e) => update('engineSize', e.target.value)}
              />
            </div>
            <div>
              <label className={lbl}>Fuel</label>
              <select
                className={sel}
                value={value.fuel}
                onChange={(e) => update('fuel', e.target.value as Fuel)}
              >
                <option>Unknown</option>
                <option>Pump gas</option>
                <option>E85</option>
                <option>Race gas</option>
                <option>Flex fuel</option>
              </select>
            </div>
          </div>

          {/* 0-60 + 60-130 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>0-60 Time (sec)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                className={inp}
                placeholder="e.g. 4.2"
                value={value.zeroToSixty}
                onChange={(e) => numericChange('zeroToSixty', e.target.value)}
              />
            </div>
            <div>
              <label className={lbl}>60-130 Time (sec)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                className={inp}
                placeholder="e.g. 10.2"
                value={value.sixtyToOneThirty}
                onChange={(e) =>
                  numericChange('sixtyToOneThirty', e.target.value)
                }
              />
            </div>
          </div>

          {/* Quarter Mile + Trap Speed */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Quarter Mile (sec)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                className={inp}
                placeholder="e.g. 11.8"
                value={value.quarterMile}
                onChange={(e) => numericChange('quarterMile', e.target.value)}
              />
            </div>
            <div>
              <label className={lbl}>Trap Speed (mph)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                className={inp}
                placeholder="e.g. 118"
                value={value.trapSpeed}
                onChange={(e) => numericChange('trapSpeed', e.target.value)}
              />
            </div>
          </div>

          {/* Electric Motor Count + Hybrid Layout */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Electric Motor Count</label>
              <select
                className={sel}
                value={value.electricMotorCount ?? 'Unknown'}
                onChange={(e) =>
                  update('electricMotorCount', e.target.value as ElectricMotorCount)
                }
              >
                <option>Unknown</option>
                <option>None</option>
                <option>1 motor</option>
                <option>2 motors</option>
                <option>3 motors</option>
                <option>4+ motors</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Hybrid Layout</label>
              <select
                className={sel}
                value={value.hybridLayout ?? 'Unknown'}
                onChange={(e) =>
                  update('hybridLayout', e.target.value as HybridLayout)
                }
              >
                <option>Unknown</option>
                <option>Mild hybrid</option>
                <option>Traditional hybrid</option>
                <option>Plug-in hybrid</option>
                <option>Performance hybrid</option>
              </select>
            </div>
          </div>

          {/* Mods */}
          <div>
            <label className={lbl}>Mods / Notes</label>
            <textarea
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
              placeholder="e.g. intake, tune, coilovers..."
              value={value.mods}
              onChange={(e) => update('mods', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
