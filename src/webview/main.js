document.addEventListener('DOMContentLoaded', function(){

	var cy = window.cy = cytoscape({
		container: document.getElementById('cy'),

		layout: {
			name: 'avsdf',
			nodeSeparation: 120
		},

		style: [
			{
				selector: 'node',
				style: {
					'label': 'data(name)',
					'text-valign': 'center',
					'color': '#ffffff',
					'background-color': '#3a7ecf',
					'shape': "roundrectangle",
					'padding': '6px'
				}
			},

			{
				selector: 'edge',
				style: {
					'label': 'data(name)',
					"curve-style": "bezier",
					'width': 2,
					'line-color': '#3a7ecf',
					'opacity': 0.5,
					"target-arrow-shape": "triangle",
					"target-arrow-color": "#3a7ecf"
				}
			}
		],

		elements: {
			nodes: [],
			edges: []
		}
	});

	document.getElementById("addButton").addEventListener("click", function(){
		addNode();
	});

	window.addEventListener('message', event => {
		const message = event.data;

		if(message.node !== undefined) {
			addNode(message.node);
		}

		if(message.edge !== undefined) {
			addEdge(message.edge);
		}

		if(message.clear !== undefined) {
			clearGraph();
		}
	});
	
	function clearGraph(){
		cy.edges().remove();
		cy.elements().remove();
	}
	
	function addNode(node){
		cy.add({
			group: 'nodes',
			data: { id: node.identifier, name: node.name, weight: 1 }
		});
		
		if(node.parent !== null){
			cy.add({
				group: 'edges',
				data: { source: node.parent.identifier, name: 'EdgeT', target: node.identifier, directed: 'false' }
			});
		}
		
		var layout = cy.layout({
			name: 'avsdf',
			animate: "end",
			animationDuration: 700,
			animationEasing: 'ease-in-out',
			nodeSeparation: 120
		});

		layout.run();
	}

	function addEdge(edge){	
		cy.add({
			group: 'edges',
			data: { source: edge.source, name: 'EdgeT', target: edge.target, directed: 'false' }
		});
		
		var layout = cy.layout({
			name: 'avsdf',
			animate: "end",
			animationDuration: 700,
			animationEasing: 'ease-in-out',
			nodeSeparation: 120
		});

		layout.run();
	}

});