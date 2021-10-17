document.addEventListener('DOMContentLoaded', function(){
	window.addEventListener('message', event => {
		const message = event.data;

		if(message.node !== undefined) {
			addNode(message.node);
		}

		if(message.edge !== undefined) {
			addLink(message.edge);
		}

		if(message.clear !== undefined) {
			clearGraph();
		}
	});
	
	function clearGraph(){
		nodes = [];
		links = [];

		updateGraphData();
	}

	document.getElementById("nodeSymbolRadio").addEventListener("change", function(){
		changeNodePresentationMode("symbol");
	});

	document.getElementById("nodeTextRadio").addEventListener("change", function(){
		changeNodePresentationMode("text");
	});

	document.getElementById("edgeTextShowRadio").addEventListener("change", function(){
		changeEdgePresentationMode("show");
	});

	document.getElementById("edgeTextHideRadio").addEventListener("change", function(){
		changeEdgePresentationMode("hide");
	});

	document.getElementById("edgeArrowShowRadio").addEventListener("change", function(){
		changeEdgeArrowMode("show");
	});

	document.getElementById("edgeArrowHideRadio").addEventListener("change", function(){
		changeEdgeArrowMode("hide");
	});

	document.getElementById("edgeParticleShowRadio").addEventListener("change", function(){
		changeEdgeParticleMode("show");
	});

	document.getElementById("edgeParticleHideRadio").addEventListener("change", function(){
		changeEdgeParticleMode("hide");
	});

	function changeNodePresentationMode(mode){
		if(mode === "text") {
			showNodeAsText();
		}

		if(mode === "symbol") {
			showNodeAsSymbol();
		}
	}

	function changeEdgePresentationMode(mode){
		if(mode === "show") {
			showEdgeShowText();
		}

		if(mode === "hide") {
			showEdgeHideText();
		}
	}

	function changeEdgeArrowMode(mode){
		if(mode === "show") {
			showEdgeShowArrow();
		}

		if(mode === "hide") {
			showEdgeHideArrow();
		}
	}

	function changeEdgeParticleMode(mode){
		if(mode === "show") {
			showEdgeShowParticle();
		}

		if(mode === "hide") {
			showEdgeHideParticle();
		}
	}

	const getColor = node => !node.childLinks.length ? 'green' : node.collapsed ? 'red' : 'blue';

	function nodePaint(node, color, ctx) {
		ctx.fillStyle = color;

		if(node.nodeType === 'method'){
			ctx.beginPath(); 
			ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
			ctx.fill();
		}
			
		
		if(node.nodeType === 'stackframe'){
			ctx.beginPath(); 
			ctx.moveTo(node.x, node.y - 4);
			ctx.lineTo(node.x - 4, node.y + 4);
			ctx.lineTo(node.x + 4, node.y + 4);
			ctx.fill();
		}
	}

	function showNodeAsSymbol(){
		Graph
			// .nodeAutoColorBy('group')
			// .nodePointerAreaPaint(null);
			.nodeCanvasObject((node, ctx) => nodePaint(node, getColor(node), ctx))
			.nodePointerAreaPaint(nodePaint);
	}

	function showNodeAsText(){
		Graph
			// .nodeAutoColorBy('group')
			.nodeCanvasObject((node, ctx) => {
				node.color = getColor(node);

				const label = node.name;
				const fontSize = 5;
				ctx.font = `${fontSize}px Sans-Serif`;
				const textWidth = ctx.measureText(label).width;
				const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

				ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
				ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillStyle = node.color;
				ctx.fillText(label, node.x, node.y);

				// let el = document.getElementById("graph");
				// el.style.cursor = null;//node && node.childLinks.length ? 'pointer' : null;

				node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
			})
			.nodePointerAreaPaint((node, color, ctx) => {
				ctx.fillStyle = color;
				const bckgDimensions = node.__bckgDimensions;
				bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
			});
	}

	function showEdgeHideText(){
		Graph
			.linkCanvasObjectMode(null)
			.linkCanvasObject(null);
	}

	function showEdgeShowText(){
		Graph
			.linkCanvasObjectMode(() => 'after')
			.linkCanvasObject((link, ctx) => {
				const MAX_FONT_SIZE = 4;
				const LABEL_NODE_MARGIN = Graph.nodeRelSize() * 1.5;

				const start = link.source;
				const end = link.target;

				// ignore unbound links
				if (typeof start !== 'object' || typeof end !== 'object') { return; }

				// calculate label positioning
				const textPos = Object.assign(...['x', 'y'].map(c => ({
					[c]: start[c] + (end[c] - start[c]) / 2 // calc middle point
				})));

				const relLink = { x: end.x - start.x, y: end.y - start.y };

				const maxTextLength = Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) - LABEL_NODE_MARGIN * 2;

				let textAngle = Math.atan2(relLink.y, relLink.x);
				// maintain label vertical orientation for legibility
				if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
				if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);

				//const label = `${link.source.id} > ${link.target.id}`;
				const label = `${link.name}`;

				// estimate fontSize to fit in link length
				ctx.font = '1px Sans-Serif';
				const fontSize = Math.min(MAX_FONT_SIZE, maxTextLength / ctx.measureText(label).width);
				ctx.font = `${fontSize}px Sans-Serif`;
				const textWidth = ctx.measureText(label).width;
				const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

				// draw text label (with background rect)
				ctx.save();
				ctx.translate(textPos.x, textPos.y);
				ctx.rotate(textAngle);

				ctx.fillStyle = 'rgba(255, 255, 255, 1)';
				ctx.fillRect(- bckgDimensions[0] / 2, - bckgDimensions[1] / 2, ...bckgDimensions);

				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillStyle = 'black';
				ctx.fillText(label, 0, 0);
				ctx.restore();
			});
	}

	function showEdgeHideArrow(){
		Graph
			.linkDirectionalArrowLength(0);
	}

	function showEdgeShowArrow(){
		Graph
			.linkDirectionalArrowLength(6)
			.linkDirectionalArrowRelPos(2);
	}

	function showEdgeHideParticle(){
		Graph
			.linkDirectionalParticles(0);
	}

	function showEdgeShowParticle(){
		Graph
			.linkDirectionalParticles(1)
			.linkDirectionalParticleWidth(3);
	}

	function addLink(originalLink){
		let link = {source: originalLink.source, target: originalLink.target, name: originalLink.sequence }; //+ ':' + originalLink.linkName}; //todo review link name
		links.push(link);

		nodes.find(element => element.id === originalLink.source).collapsed = false;
		nodes.find(element => element.id === originalLink.target).collapsed = false;

		nodes.forEach(node => {
			node.childLinks = [];
		});

		links.forEach(link => {
			if((typeof link.source) === 'object'){
				nodes.find(element => element.id === link.source.id).childLinks.push(link);
			}else{
				nodes.find(element => element.id === link.source).childLinks.push(link);
			}
		});

		updateGraphData();
	}

	function addFirstNode(originalNode){
		let node = { id: originalNode.id, name: originalNode.name, collapsed: true, childLinks: [], nodeType: originalNode.type, root: true };
		nodes.push(node);

		updateGraphData();
	}

	function addNode(originalNode){
		if(nodes.length === 0) { 
			addFirstNode(originalNode); return; 
		}

		if(originalNode.parent === null) {
			addFirstNode(originalNode); return; 
		}

		console.log(originalNode);

		let nodeFatherId = originalNode.parent.id;
		
		nodes[nodeFatherId].collapsed = false;

		let nodeId = originalNode.id;
		let node = { id: nodeId, name: originalNode.name, collapsed: true, childLinks: [], nodeType: originalNode.type, root: false };
		nodes.push(node);

		let link = {source: nodeFatherId, target: nodeId, name: originalNode.sequence }; //+ ':' + originalNode.linkName}; // todo review link name
		links.push(link);

		nodes.forEach(node => {
			node.childLinks = [];
		});

		links.forEach(link => {
			if((typeof link.source) === 'object'){
				nodes.find(element => element.id === link.source.id).childLinks.push(link);
			}else{
				nodes.find(element => element.id === link.source).childLinks.push(link);
			}
		});

		updateGraphData();
	}

	const updateGraphData = () => {
		Graph.graphData(getPrunedTree());
	};

	const getPrunedTree = () => {
		const visibleNodes = [];
		const visibleLinks = [];

		if (nodes.length === 0) {
			return { nodes: visibleNodes, links: visibleLinks };
		};

		const rootNodes = nodes.filter(element => element.root === true);

		rootNodes.forEach(rootNode => {
			(function traverseTree(node) {
				visibleNodes.push(node);

				if (node.collapsed) { return; }

				visibleLinks.push(...node.childLinks);
				node.childLinks
					.map(link => ((typeof link.target) === 'object') ? link.target : nodes.find(element => element.id === link.target))
					.forEach(traverseTree);
			})(rootNode); // IIFE
		});

		return { nodes: visibleNodes, links: visibleLinks };
	};

	//--init--

	let nodes = [];
	let links = [];

	const Graph = ForceGraph();
	const elem = document.getElementById("graph");
	Graph(elem)
		//.onNodeHover(node => elem.style.cursor = node && node.childLinks.length ? 'pointer' : null)
		.onNodeClick(node => {
			if (node.childLinks.length) {
				node.collapsed = !node.collapsed; // toggle collapse state
				updateGraphData();
			}
		})
		.linkColor(link => 'white');

	showEdgeHideParticle();
	showEdgeShowArrow();
	showNodeAsText();
	showEdgeShowText();
});