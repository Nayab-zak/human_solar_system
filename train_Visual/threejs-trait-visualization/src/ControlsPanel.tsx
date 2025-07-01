import React from "react";
import {
  ZoomIn,
  ZoomOut,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Lock,
  Unlock,
  RefreshCw,
} from "lucide-react";

interface ControlsPanelProps {
  nodeOptions: { label: string; value: number }[];
  centralNodeIndex: number;
  setCentralNodeIndex: (idx: number) => void;
  nodeCount: number;
  setNodeCount: (n: number) => void;
  attributeCount: number;
  setAttributeCount: (n: number) => void;
  k: number;
  setK: (k: number) => void;
  kRep: number;
  setKRep: (k: number) => void;
  angularSpeed: number;
  setAngularSpeed: (n: number) => void;
  nodeSize: number;
  setNodeSize: (n: number) => void;
  centralSize: number;
  setCentralSize: (n: number) => void;
  nodeColor: string;
  setNodeColor: (c: string) => void;
  centralColor: string;
  setCentralColor: (c: string) => void;
  onCameraMove: (dir: 'left' | 'right' | 'up' | 'down') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLockToggle: () => void;
  lockState: boolean;
  onResetCamera: () => void;
  mode?: 'night' | 'day';
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  nodeOptions,
  centralNodeIndex,
  setCentralNodeIndex,
  nodeCount,
  setNodeCount,
  attributeCount,
  setAttributeCount,
  k,
  setK,
  kRep,
  setKRep,
  angularSpeed,
  setAngularSpeed,
  nodeSize,
  setNodeSize,
  centralSize,
  setCentralSize,
  nodeColor,
  setNodeColor,
  centralColor,
  setCentralColor,
  onCameraMove,
  onZoomIn,
  onZoomOut,
  onLockToggle,
  lockState,
  onResetCamera,
  mode = 'night',
}) => {
  const panelBg = mode === 'night' ? '#23203a' : '#fff';
  const panelText = mode === 'night' ? '#fff' : '#23203a';

  const iconBtnStyle = {
    padding: '8px',
    borderRadius: '8px',
    border: '2px solid #C300FF',
    background: 'transparent',
    color: '#C300FF',
    cursor: 'pointer' as 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    transition: 'background 0.3s, transform 0.3s',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  } as React.CSSProperties;

  // Panel input styles for alignment
  const panelNumberStyle: React.CSSProperties = {
    width: 48, borderRadius: 4, border: '1px solid #c300ff55', background: 'rgba(35,32,58,0.12)', color: 'inherit', padding: '2px 4px', fontSize: '0.97em',
  };
  const panelSliderStyle: React.CSSProperties = {
    width: 70, accentColor: '#c300ff',
  };
  const panelValueStyle: React.CSSProperties = {
    marginLeft: 4, fontWeight: 600, color: '#c300ff', fontSize: '0.97em',
  };

  return (
    <div
      style={{
        background: mode === 'night' ? 'rgba(35,32,58,0.55)' : 'rgba(255,255,255,0.55)',
        color: panelText,
        borderRadius: 18,
        boxShadow: mode === 'night' ? '0 4px 24px #c300ff44, 0 1.5px 8px #0008' : '0 4px 24px #c300ff22, 0 1.5px 8px #0002',
        padding: 28,
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 10002,
        minWidth: 220,
        maxWidth: 260,
        minHeight: 420,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        border: '2px solid #c300ff33',
        transition: 'background 0.3s, color 0.3s',
        opacity: 0.98,
        backdropFilter: 'blur(6px)',
        overflow: 'auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {/* Central Node Selection */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Central Node</label>
          <select
            value={centralNodeIndex}
            onChange={e => setCentralNodeIndex(Number(e.target.value))}
            style={{
              borderRadius: 5,
              padding: '2px 8px',
              fontSize: '0.97em',
              background: mode === 'night' ? '#23203a' : '#fff',
              color: mode === 'night' ? '#fff' : '#23203a',
              border: '1px solid #c300ff55',
              outline: 'none',
              minWidth: 80,
            }}
          >
            {nodeOptions.map((opt, i) => (
              <option key={i} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {/* Each control row is a flex row with label and input aligned */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Nodes</label>
          <input type="number" min={1} max={20} value={nodeCount} onChange={e => setNodeCount(Number(e.target.value))} style={panelNumberStyle} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Attributes</label>
          <input type="number" min={1} max={6} value={attributeCount} onChange={e => setAttributeCount(Number(e.target.value))} style={panelNumberStyle} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Attraction</label>
          <input type="range" min={0.1} max={2} step={0.01} value={k} onChange={e => setK(Number(e.target.value))} style={panelSliderStyle} />
          <span style={panelValueStyle}>{k.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Repulsion</label>
          <input type="range" min={0.1} max={2} step={0.01} value={kRep} onChange={e => setKRep(Number(e.target.value))} style={panelSliderStyle} />
          <span style={panelValueStyle}>{kRep.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Angular Speed</label>
          <input type="range" min={0.01} max={2} step={0.01} value={angularSpeed} onChange={e => setAngularSpeed(Number(e.target.value))} style={panelSliderStyle} />
          <span style={panelValueStyle}>{angularSpeed.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Node Size</label>
          <input type="range" min={0.5} max={5} step={0.1} value={nodeSize} onChange={e => setNodeSize(Number(e.target.value))} style={panelSliderStyle} />
          <span style={panelValueStyle}>{nodeSize.toFixed(1)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Sun Size</label>
          <input type="range" min={1} max={10} step={0.1} value={centralSize} onChange={e => setCentralSize(Number(e.target.value))} style={panelSliderStyle} />
          <span style={panelValueStyle}>{centralSize.toFixed(1)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Node Color</label>
          <input type="color" value={nodeColor} onChange={e => setNodeColor(e.target.value)} style={{ ...panelNumberStyle, width: 36, height: 28, padding: 0, border: 'none', background: 'none' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Sun Color</label>
          <input type="color" value={centralColor} onChange={e => setCentralColor(e.target.value)} style={{ ...panelNumberStyle, width: 36, height: 28, padding: 0, border: 'none', background: 'none' }} />
        </div>
      </div>
      {/* Camera Controls - compact row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14,
        justifyItems: 'center',
        alignItems: 'center',
        marginTop: 18,
        marginBottom: 6,
        width: '100%',
      }}>
        {/* Row 1: Up */}
        <div />
        <button style={iconBtnStyle} onClick={() => onCameraMove('up')} title="Pan Up"><ArrowUp size={22} /></button>
        <div />
        {/* Row 2: Left, Reset, Right */}
        <button style={iconBtnStyle} onClick={() => onCameraMove('left')} title="Pan Left"><ArrowLeft size={22} /></button>
        <button style={iconBtnStyle} onClick={onResetCamera} title="Reset Camera"><RefreshCw size={22} /></button>
        <button style={iconBtnStyle} onClick={() => onCameraMove('right')} title="Pan Right"><ArrowRight size={22} /></button>
        {/* Row 3: Zoom In, Down, Zoom Out */}
        <button style={iconBtnStyle} onClick={onZoomIn} title="Zoom In"><ZoomIn size={22} /></button>
        <button style={iconBtnStyle} onClick={() => onCameraMove('down')} title="Pan Down"><ArrowDown size={22} /></button>
        <button style={iconBtnStyle} onClick={onZoomOut} title="Zoom Out"><ZoomOut size={22} /></button>
        {/* Row 4: Lock/Unlock (centered) */}
        <div />
        <button style={iconBtnStyle} onClick={onLockToggle} title={lockState ? 'Unlock Camera' : 'Lock Camera'}>{lockState ? <Unlock size={22} /> : <Lock size={22} />}</button>
        <div />
      </div>
    </div>
  );
};

// --- Helper Components ---

type ControlSliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  accent: string;
};

const ControlSlider: React.FC<ControlSliderProps> = ({ label, value, min, max, step = 1, onChange, accent }) => (
  <label className="flex flex-col gap-1 text-sm font-medium text-[#fff]">
    <span className="mb-1">{label}</span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full accent-[#FF3366] h-2 rounded-lg"
      style={{
        accentColor: accent,
        background: "#23203a",
      }}
    />
    <span className="text-xs text-[#C300FF] font-semibold mt-1">{value}</span>
  </label>
);

type ControlNumberProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

const ControlNumber: React.FC<ControlNumberProps> = ({ label, value, min, max, onChange }) => (
  <label className="flex flex-col gap-1 text-sm font-medium text-[#fff]">
    <span className="mb-1">{label}</span>
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full rounded-md px-2 py-1 bg-[#23203a] border border-[#C300FF] text-[#C300FF] font-medium"
    />
  </label>
);

type ControlColorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const ControlColor: React.FC<ControlColorProps> = ({ label, value, onChange }) => (
  <label className="flex flex-col gap-1 text-sm font-medium text-[#fff]">
    <span className="mb-1">{label}</span>
    <input
      type="color"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-10 h-8 rounded-md border-2 border-[#C300FF] bg-[#23203a] p-0"
      style={{ boxShadow: "0 0 8px #C300FF55" }}
    />
  </label>
);

type IconButtonProps = {
  onClick: () => void;
  icon: React.ReactNode;
};

const IconButton: React.FC<IconButtonProps> = ({ onClick, icon }) => (
  <button
    onClick={onClick}
    className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#C300FF] bg-[#23203a] hover:shadow-[0_0_12px_2px_#C300FF99] transition-shadow duration-150"
    style={{ color: "#C300FF" }}
  >
    {icon}
  </button>
);
