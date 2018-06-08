const ELEMENT_NODE = 1
const TEXT_NODE = 3
const COMMENT_NODE = 8

// diff elements and apply the resulting patch to the old node
// (obj, obj) -> null
// getEvents is a function inherited from the nanomorph function
// it is required to properly bind and remove events from the nodes
module.exports = (newNode, oldNode, getEvents) => {
  const nodeType = newNode.nodeType
  const nodeName = newNode.nodeName

  switch (nodeType) {
    case ELEMENT_NODE:
      copyAttrs(newNode, oldNode)
      copyEvents(newNode, oldNode, getEvents)
      if (nodeName === 'INPUT') updateInput(newNode, oldNode)
      break
    case TEXT_NODE:
    case COMMENT_NODE:
      if (oldNode.nodeValue !== newNode.nodeValue) {
        oldNode.nodeValue = newNode.nodeValue
      }
  }
}

const copyAttrs = (newNode, oldNode) => {
  const oldAttrs = oldNode.attributes
  const newAttrs = newNode.attributes

  Array.from(newAttrs).forEach(attr => {
    const attrName = attr.localName
    const attrNamespaceURI = attr.namespaceURI
    const attrValue = attr.value
    // if we don't have the attribute, add it
    if (!oldNode.hasAttributeNS(attrNamespaceURI, attrName)) {
      oldNode.setAttributeNS(attrNamespaceURI, attrName, attrValue)
    // if we have the attribute, it might have changed / been set to null
    } else {
      const fromValue = oldNode.getAttributeNS(attrNamespaceURI, attrName)
      if (fromValue === attrValue) return null // ignore, values are the same
      // remove attrs that have been set to null or undefined (cast to strings)
      if (attrValue === 'null' || attrValue === 'undefined') {
        oldNode.removeAttributeNS(attrNamespaceURI, attrName)
      } else {
        oldNode.setAttributeNS(attrNamespaceURI, attrName, attrValue)
      }
    }
  })

  // Remove any extra attributes found on the original DOM element that
  // weren't found on the target element.
  Array.from(oldAttrs).forEach(attr => {
    const attrName = attr.localName
    const attrNamespaceURI = attr.namespaceURI

    if (!newNode.hasAttributeNS(attrNamespaceURI, attrName)) {
      oldNode.removeAttributeNS(attrNamespaceURI, attrName)
    }
  })
}

const copyEvents = (newNode, oldNode, getEvents) => {
  if (!getEvents) return false
  const events = getEvents(newNode, oldNode)
  events.forEach(eventName => {
    if (newNode[eventName]) {           // if new element has event
      oldNode[eventName] = newNode[eventName]  // update existing element
    } else if (oldNode[eventName]) {    // if existing element has it and new one doesnt
      oldNode[eventName] = undefined    // remove it from existing element
    }
  })
}

// The "value" attribute is special for the <input> element since it sets the
// initial value. Changing the "value" attribute without changing the "value"
// property will have no effect since it is only used to the set the initial
// value. Similar for the "checked" attribute, and "disabled".
const updateInput = (newNode, oldNode) => {
  const newValue = newNode.value
  const oldValue = oldNode.value

  updateAttribute(newNode, oldNode, 'checked')
  updateAttribute(newNode, oldNode, 'disabled')

  if (newValue !== oldValue) {
    oldNode.setAttributeNS(null, 'value', newValue)
    oldNode.value = newValue
  }

  if (newValue === 'null') {
    oldNode.value = ''
    oldNode.removeAttributeNS(null, 'value')
  }

  if (!newNode.hasAttributeNS(null, 'value')) {
    oldNode.removeAttributeNS(null, 'value')
  } else if (oldNode.type === 'range') {
    // this is so elements like slider move their UI thingy
    oldNode.value = newValue
  }
}

const updateAttribute = (newNode, oldNode, name) => {
  if (newNode[name] !== oldNode[name]) {
    oldNode[name] = newNode[name]
    if (newNode[name]) {
      oldNode.setAttributeNS(null, name, '')
    } else {
      oldNode.removeAttributeNS(null, name)
    }
  }
}
