export const PROCEDURES = {
  underEyeFiller: {
    label: 'Under-Eye Fillers',
    area: 'under-eyes',
    color: '#00bcd4',
    viewer3D: 'forehead'
  },

  laserEye: {
    label: 'Laser Resurfacing',
    area: 'under-eyes',
    color: '#00bcd4',
    viewer3D: 'crowsfeet'
  },

  lipFiller: {
    label: 'Lip Fillers',
    area: 'lips',
    color: '#c084fc',
    viewer3D: 'lip'
  },

  lipFlip: {
    label: 'Lip Flip',
    area: 'lips',
    color: '#c084fc',
    viewer3D: 'lip'
  },

  foreheadBotox: {
    label: 'Forehead Botox',
    area: 'forehead',
    color: '#ff4d6d',
    viewer3D: 'forehead'
  },

  glabella: {
    label: '11 Lines',
    area: 'forehead',
    color: '#f59e0b',
    viewer3D: 'glabella'
  },

  crowsfeet: {
    label: "Crow’s Feet",
    area: 'eyes',
    color: '#22c55e',
    viewer3D: 'crowsfeet'
  },

  chemicalPeel: {
    label: 'Chemical Peel',
    area: 'full-face',
    color: '#38bdf8',
    viewer3D: 'forehead'
  }
};

export function getProcedureLabel(key) {
  return PROCEDURES[key]?.label || key;
}

export function getViewerProcedure(key) {
  return PROCEDURES[key]?.viewer3D || 'forehead';
}

export function getProcedureColor(key) {
  return PROCEDURES[key]?.color || '#00bcd4';
}
