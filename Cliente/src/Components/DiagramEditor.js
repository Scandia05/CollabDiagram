import React, { useRef, useEffect, useState, useContext } from 'react';
import './DiagramEditor.css';
import { useNavigate } from 'react-router-dom';
import socket from './socket';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import Modal from 'react-modal';

const mx = require('mxgraph')({
    mxBasePath: 'node_modules/mxgraph/javascript/src'
});

const { mxGraph, mxRubberband, mxClient, mxUtils, mxConstants, mxCodec, mxEvent, mxGeometry, mxCell } = mx;

Modal.setAppElement('#root'); // Definir el elemento principal para el modal

const DiagramEditor = () => {
    const navigate = useNavigate();
    const { token, username } = useContext(AuthContext);
    const graphContainer = useRef(null);
    const graph = useRef(null);
    const [nodeColor, setNodeColor] = useState('#000000');
    const [nodeShape, setNodeShape] = useState(mxConstants.SHAPE_RECTANGLE);
    const [edgeStyle, setEdgeStyle] = useState('straight');
    const loading = useRef(false); 
    const [clientId, setClientId] = useState(null); 
    const cursors = useRef({}); 
    const [scale, setScale] = useState(1);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [targetUsernameOrEmail, setTargetUsernameOrEmail] = useState('');

    useEffect(() => {
        if (!mxClient.isBrowserSupported()) {
            mxUtils.alert('El navegador no es compatible!');
            return;
        }

        graph.current = new mxGraph(graphContainer.current);
        new mxRubberband(graph.current);

        let id = localStorage.getItem('client-id');
        if (!id) {
            id = 1;
        } else {
            id = parseInt(id);
        }
        if (!sessionStorage.getItem('client-id')) {
            localStorage.setItem('client-id', id + 1);
            sessionStorage.setItem('client-id', id);
        } else {
            id = parseInt(sessionStorage.getItem('client-id'));
        }
        setClientId(id);

        socket.auth = { token };
        socket.connect();

        socket.on('connect', () => {
            console.log('Connected to server');
        });

        socket.on('diagram-update', (xml) => {
            if (!loading.current) {
                loadGraphFromXml(xml);
            }
        });

        socket.on('cursor-update', ({ id, x, y, username }) => {
            updateCursor(id, x, y, username);
        });

        socket.on('load-diagram', (xml) => {
            if (!loading.current) {
                loadGraphFromXml(xml);
            }
        });

        graph.current.getModel().addListener(mxEvent.CHANGE, () => {
            if (!loading.current) {
                const encoder = new mxCodec();
                const node = encoder.encode(graph.current.getModel());
                const xml = mxUtils.getXml(node);
                socket.emit('diagram-update', xml);
            }
        });

        graph.current.addMouseListener({
            mouseMove: (sender, me) => {
                const pt = me.getGraphX() != null && me.getGraphY() != null
                    ? graph.current.getPointForEvent(me.getEvent())
                    : null;

                if (pt) {
                    socket.emit('cursor-update', { id: clientId, x: pt.x, y: pt.y, username });
                }
            },
            mouseDown: () => {},
            mouseUp: () => {}
        });

        return () => {
            graph.current.destroy();
            socket.off('diagram-update');
            socket.off('cursor-update');
            socket.off('load-diagram');
        };
    }, [clientId, username, token]); 

    useEffect(() => {
        updateStyles();
    }, [nodeColor, nodeShape, edgeStyle]);

    const updateStyles = () => {
        if (!graph.current) return;

        const vertexStyle = graph.current.getStylesheet().getDefaultVertexStyle();
        vertexStyle[mxConstants.STYLE_SHAPE] = nodeShape;
        vertexStyle[mxConstants.STYLE_FILLCOLOR] = nodeColor;
        vertexStyle[mxConstants.STYLE_CONNECTABLE] = 1;

        const edgeStyleObject = graph.current.getStylesheet().getDefaultEdgeStyle();
        edgeStyleObject[mxConstants.STYLE_STROKEWIDTH] = 2;
        edgeStyleObject[mxConstants.STYLE_DASHED] = (edgeStyle === 'dotted');
        edgeStyleObject[mxConstants.STYLE_ENDARROW] = (edgeStyle === 'none') ? mxConstants.NONE : mxConstants.ARROW_BLOCK;

        graph.current.refresh();
    };

    const loadGraphFromXml = (xml) => {
        if (!graph.current) return;

        loading.current = true; 
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, "text/xml");
        const diagramModel = convertXmlToModel(xmlDoc);

        graph.current.getModel().beginUpdate();
        try {
            graph.current.getModel().clear();
            const parent = graph.current.getDefaultParent();
            createGraphicalElements(diagramModel, parent);
        } finally {
            graph.current.getModel().endUpdate();
            graph.current.refresh();
            loading.current = false; 
        }
    };

    const convertXmlToModel = (xmlDoc) => {
        const cells = [];
        const root = xmlDoc.getElementsByTagName('root')[0];

        for (let i = 0; i < root.childNodes.length; i++) {
            const node = root.childNodes[i];
            if (node.nodeType === 1) { 
                const cell = new mxCell();
                cell.id = node.getAttribute('id');
                cell.value = node.getAttribute('value');
                cell.style = node.getAttribute('style');
                cell.vertex = node.getAttribute('vertex') === '1';
                cell.edge = node.getAttribute('edge') === '1';
                cell.source = node.getAttribute('source');
                cell.target = node.getAttribute('target');

                const geoNode = node.getElementsByTagName('mxGeometry')[0];
                if (geoNode) {
                    const geo = new mxGeometry();
                    geo.x = parseFloat(geoNode.getAttribute('x')) || 0;
                    geo.y = parseFloat(geoNode.getAttribute('y')) || 0;
                    geo.width = parseFloat(geoNode.getAttribute('width')) || 40;
                    geo.height = parseFloat(geoNode.getAttribute('height')) || 15;
                    geo.relative = geoNode.getAttribute('relative') === '1';
                    cell.geometry = geo;
                }

                cells.push(cell);
            }
        }

        return cells;
    };

    const createGraphicalElements = (diagramModel, parent) => {
        diagramModel.forEach(cell => {
            if (cell.vertex) {
                graph.current.insertVertex(parent, cell.id, cell.value, cell.geometry.x, cell.geometry.y, cell.geometry.width, cell.geometry.height, cell.style);
            } else if (cell.edge) {
                const source = graph.current.getModel().getCell(cell.source);
                const target = graph.current.getModel().getCell(cell.target);
                if (source && target) {
                    graph.current.insertEdge(parent, cell.id, cell.value, source, target, cell.style);
                }
            }
        });
    };

    const updateCursor = (id, x, y, username) => {
        if (!graphContainer.current) return;

        let cursorElement = cursors.current[id];
        if (!cursorElement) {
            cursorElement = document.createElement('div');
            cursorElement.className = 'cursor';
            cursorElement.innerText = username;
            cursorElement.style.position = 'absolute';
            cursorElement.style.pointerEvents = 'none';
            cursorElement.style.background = 'rgba(255, 255, 255, 0.7)';
            cursorElement.style.border = '1px solid #000';
            cursorElement.style.padding = '2px';
            cursorElement.style.zIndex = '1000';
            graphContainer.current.appendChild(cursorElement);
            cursors.current[id] = cursorElement;
        }

        cursorElement.style.left = `${x * scale}px`;
        cursorElement.style.top = `${y * scale}px`;
    };

    const addVertex = () => {
        const parent = graph.current.getDefaultParent();
        graph.current.getModel().beginUpdate();
        try {
            graph.current.insertVertex(parent, null, 'Node', 100, 100, 40, 15, `shape=${nodeShape};fillColor=${nodeColor}`);
        } finally {
            graph.current.getModel().endUpdate();
            graph.current.refresh();
        }
    };

    const connectVertices = () => {
        const selectedCells = graph.current.getSelectionCells();
        if (selectedCells.length === 2) {
            graph.current.getModel().beginUpdate();
            try {
                const edge = graph.current.insertEdge(graph.current.getDefaultParent(), null, '', selectedCells[0], selectedCells[1]);
                edge.setStyle(`dashed=${edgeStyle === 'dotted'};endArrow=${edgeStyle === 'none' ? 'none' : 'block'}`);
            } finally {
                graph.current.getModel().endUpdate();
                graph.current.refresh();
            }
        } else {
            console.error('Selecciona exactamente dos nodos para realizar la conexion.');
        }
    };

    const deleteVertex = () => {
        const selected = graph.current.getSelectionCell();
        if (selected) {
            graph.current.getModel().beginUpdate();
            try {
                graph.current.removeCells([selected]);
            } finally {
                graph.current.getModel().endUpdate();
                graph.current.refresh();
            }
        } else {
            console.error('Seleccione un nodo para eliminar.');
        }
    };

    const saveDiagram = () => {
        const encoder = new mxCodec();
        const node = encoder.encode(graph.current.getModel());
        const xml = mxUtils.getXml(node);
        const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'diagram.xml';
        link.click();
        URL.revokeObjectURL(url);
    };

    const shareDiagram = async () => {
        const encoder = new mxCodec();
        const node = encoder.encode(graph.current.getModel());
        const xml = mxUtils.getXml(node);

        try {
            const response = await axios.post('http://200.13.4.230:4000/share', 
                { targetUsernameOrEmail, diagramXml: xml }, 
                { headers: { Authorization: token } }
            );
            console.log(response.data);
        } catch (error) {
            console.error('Error sharing diagram:', error);
        }
    };

    const openModal = () => setModalIsOpen(true);
    const closeModal = () => setModalIsOpen(false);

    const zoomIn = () => {
        setScale(scale * 1.2);
        graph.current.zoomIn();
    };

    const zoomOut = () => {
        setScale(scale / 1.2);
        graph.current.zoomOut();
    };

    const goBack = () => {
        navigate('/menu');
    };

    return (
        <div className="diagram-editor">
            <div ref={graphContainer} className="graph-container" />
            <div className="toolbar">
                <button onClick={goBack}>Volver atrás</button>
                <button onClick={addVertex}>Añadir Nodo</button>
                <button onClick={connectVertices}>Conectar Nodo</button>
                <button onClick={deleteVertex}>Borrar Nodo</button>
                <button onClick={saveDiagram}>Guardar Diagrama</button>
                <button onClick={zoomIn}>Zoom In</button>
                <button onClick={zoomOut}>Zoom Out</button>
                <input type="color" value={nodeColor} onChange={e => setNodeColor(e.target.value)} />
                <select onChange={e => setNodeShape(e.target.value)}>
                    <option value={mxConstants.SHAPE_RECTANGLE}>Rectángulo</option>
                    <option value={mxConstants.SHAPE_ELLIPSE}>Elipse</option>
                    <option value={mxConstants.SHAPE_RHOMBUS}>Rombo</option>
                    <option value={mxConstants.SHAPE_CYLINDER}>Cilindro</option>
                </select>
                <select onChange={e => setEdgeStyle(e.target.value)}>
                    <option value="straight">Continua con punta</option>
                    <option value="dotted">Punteada con punta</option>
                    <option value="none">Continua sin punta</option>
                </select>
                <button onClick={openModal}>Compartir Diagrama</button>
                <div className="client-id-display">Cliente {clientId}</div>
            </div>
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                contentLabel="Compartir Diagrama"
                className="Modal"
                overlayClassName="Overlay"
            >
                <h2>Compartir Diagrama</h2>
                <input 
                    type="text" 
                    placeholder="Enter username or email" 
                    value={targetUsernameOrEmail}
                    onChange={(e) => setTargetUsernameOrEmail(e.target.value)}
                />
                <button onClick={shareDiagram}>Compartir</button>
                <button onClick={closeModal}>Cerrar</button>
            </Modal>
        </div>
    );
};

export default DiagramEditor;
