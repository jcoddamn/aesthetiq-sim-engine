export const PROCEDURES = {
  underEyeFiller: {
    label: 'Under-Eye Fillers',
    area: 'under-eyes',
    viewer3D: 'forehead',
    effect2D: 'underEyeFiller'
  },

  laserEye: {
    label: 'Laser Resurfacing',
    area: 'under-eyes',
    viewer3D: 'forehead',
    effect2D: 'laserEye'
  },

  lipFiller: {
    label: 'Lip Fillers',
    area: 'lips',
    viewer3D: 'lip',
    effect2D: 'lipFiller'
  },

  lipFlip: {
    label: 'Lip Flip',
    area: 'lips',
    viewer3D: 'lip',
    effect2D: 'lipFlip'
  },

  foreheadBotox: {
    label: 'Forehead Botox',
    area: 'forehead',
    viewer3D: 'forehead',
    effect2D: 'foreheadBotox'
  },

  glabella: {
    label: '11 Lines',
    area: 'forehead',
    viewer3D: 'glabella',
    effect2D: 'glabella'
  },

  crowsfeet: {
    label: "Crow's Feet",
    area: 'eyes',
    viewer3D: 'crowsfeet',
    effect2D: 'crowsfeet'
  },

  chemicalPeel: {
    label: 'Chemical Peel',
    area: 'full-face',
    viewer3D: 'forehead',
    effect2D: 'chemicalPeel'
  }
};

export function getProcedureLabel(key) {
  return PROCEDURES[key]?.label || key;
}

export function getViewerProcedure(key) {
  return PROCEDURES[key]?.viewer3D || 'forehead';
}

export function get2DEffectProcedure(key) {
  return PROCEDURES[key]?.effect2D || key;
}
