import React, { useRef, useEffect, useMemo } from 'react';

const mx = require('mxgraph')({
    mxBasePath: 'node_modules/mxgraph/javascript/src'
});
const {
    mxGraph,
    mxCodec,
    mxUtils
} = mx;

const DiagramViewer = () => {
    const graphContainer = useRef(null);
    const xml = useMemo(() => `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="Node" style="shape=rectangle;fillColor=#000000" vertex="1" parent="1"><mxGeometry x="340" y="90" width="80" height="30" as="geometry"/></mxCell><mxCell id="3" value="Node" style="shape=rectangle;fillColor=#e85454" vertex="1" parent="1"><mxGeometry x="320" y="270" width="80" height="30" as="geometry"/></mxCell></root></mxGraphModel>`, []);

    useEffect(() => {
        if (!mx.mxClient.isBrowserSupported()) {
            mx.mxUtils.alert('El navegador no es compatible!');
            return;
        }

        const graph = new mxGraph(graphContainer.current);
        graph.setHtmlLabels(true);
        graph.setEnabled(false);

        graphContainer.current.style.height = '600px';
        graphContainer.current.style.width = '100%';

        const doc = mxUtils.parseXml(xml);
        const codec = new mxCodec(doc);
        codec.decode(doc.documentElement, graph.getModel());

        graph.refresh();

        return () => graph.destroy();
    }, [xml]); // xml is now a dependency but it's memoized

    return <div ref={graphContainer} style={{ width: '100%', height: '600px', border: '1px solid black' }} />;
};

export default DiagramViewer;




