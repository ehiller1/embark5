// Fallback implementation of three-bmfont-text
// This is a simplified version that provides the basic API
// but doesn't actually render text. It's meant to be used
// only to satisfy the dependency requirement.

export default function createText(opt) {
  return {
    text: '',
    font: null,
    width: 0,
    align: 'left',
    letterSpacing: 0,
    lineHeight: 1.5,
    mode: 'normal',
    tabSize: 4,
    position: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1 },
    color: 0xffffff,
    opacity: 1.0,
    transparent: false,
    
    update: function() {
      // No-op implementation
      return this;
    },
    
    dispose: function() {
      // No-op implementation
      return this;
    }
  };
}
