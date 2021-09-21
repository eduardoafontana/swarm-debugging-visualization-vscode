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
					'color': '#000000',
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

		switch (message.command) {
			case 'addNode': addNode(); break;
		}
	});
	
	var countNodeId = 0;
	
	function addNode(){
		cy.add({
			group: 'nodes',
			data: { id: countNodeId, name: 'Test', weight: 1}
		});
		
		if(countNodeId > 0){
			cy.add({
				group: 'edges',
				data: { source: (countNodeId - 1), name: 'EdgeT', target: countNodeId, directed: 'false'}
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

		countNodeId++;
	}

});