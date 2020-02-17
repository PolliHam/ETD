/* globals jQuery, sap, TouchEvent, d3 */

jQuery.sap.declare("sap.secmon.ui.commons.controls.ForceDirectedGraph");

jQuery.sap.require("sap.secmon.ui.commons.controls.Tooltip");
jQuery.sap.require("sap.secmon.ui.commons.controls.Legend");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/commons/controls/css/ForceDirectedGraph.css");

/**
 * Control for a d3.js based Force-Directed Graph. This control mainly acts as a
 * UI5-like wrapper control for the d3 API with some convenience
 * functionalities.
 * 
 * @see This documentation is primarily based on the original Force Layout
 *      documentation available on github:
 *      https://github.com/mbostock/d3/wiki/Force-Layout
 * 
 * @function start - Renders the graph according to its properties and starts
 *           the simulation.
 * 
 * @function stop - Terminates the simulation immediately at its current state.
 *           This can be used to stop the simulation explicitly, for example, if
 *           you want to show animation or allow other interaction. If you do
 *           not stop the layout explicitly, it will still stop automatically
 *           after the layout's cooling parameter decays below some threshold.
 * 
 * @function clear - Stops the simulation and shows the noDataIndicator. All
 *           settings done to the ForceDirectedGraph control are still
 *           available. Calling start() will redraw the Graph with all previous
 *           settings.
 * 
 * @function getSelectedNode - Returns the current selected Node, undefined if
 *           no node is selected.
 * 
 * @param {Array}
 *            nodes - An array of all nodes within this graph. Every node can be
 *            a plain object but optionally it is possible to assign some
 *            attributes to control its rendering:<br>
 *            <code>
 *               index - the zero-based index of the node within the nodes array.
 *               x - the x-coordinate of the current node position.
 *               y - the y-coordinate of the current node position.
 *               px - the x-coordinate of the previous node position.
 *               py - the y-coordinate of the previous node position.
 *               fixed - a boolean indicating whether node position is locked.
 *               centered - a boolean indicating whether node position is always in center.
 *               weight - the node weight; the number of associated links.
 *               radius - the radius of the rendered element. Assign this value for 
 *                        best collision detection and border limitation results.
 *            </code>
 * 
 * Default value: []
 * 
 * @param {Array}
 *            links - An array of all links within this graph.<br>
 *            <code>
 *               source - the source node (an element in nodes).
 *               target - the target node (an element in nodes).
 *            </code>
 * 
 * Default value: []
 * 
 * @param {Boolean}
 *            enableDragging - Enables/Disables the dragging feature of the
 *            force-directed graph.
 * 
 * Default value: true
 * 
 * @param {Number|Function}
 *            linkStrength - Describes the rigidity of a link to its nodes. Can
 *            be either a number or function. Allowed range [0 , 1]. If a
 *            function is passed it is called for every link individually
 *            passing the link and its index to the function with 'this'
 *            pointing to the force layout.
 * 
 * Default value: 1
 * 
 * @param {Number|Function}
 *            linkDistance - Can be either a number or function. If a function
 *            is passed it is called for every link individually passing the
 *            link and its index to the function with 'this' pointing to the
 *            force layout.
 * 
 * Default value: 20
 * 
 * @param {Number}
 *            friction - Sets the friction coefficient to the specified value.
 *            If a function is passed it is called for every node (in order)
 *            individually passing the node and its index to the function with
 *            'this' pointing to the force layout.
 * 
 * Default value: 0.9
 * 
 * @param {Number|Function}
 *            charge - Sets the charge strength to the specified value. Negative
 *            charge values indicate repulsion, which is the desired behavior
 *            for most force-directed graphs whereas Positive values indicate
 *            attraction which can be helpful for other visualization types.
 * 
 * Default value: -30
 * 
 * @param {Number}
 *            alpha - Describes the cooling parameter of the graph, i.e. the
 *            time it takes the force layout to finish the tick animations.
 * 
 * Default value: 0.1
 * 
 * @param {Number}
 *            theta - Sets the Barnes-Hut approximation criterion to the
 *            specified value
 * 
 * Default value: 0.8
 * 
 * @param {Number}
 *            gravity - Sets the gravitational strength to the specified
 *            numerical value.
 * 
 * Default value: 0.1
 * 
 * @param {CSSSize}
 *            width - The total width of the control.
 * 
 * Default value: 100%
 * 
 * @param {CSSSize}
 *            height - The total height of the control.
 * 
 * Default value: 400px
 * 
 * @param {Boolean}
 *            showLegend - Whether to show or hide the legend. If true, the
 *            space for the legend is taken on the right side of the control
 *            even if no Legend control was given.
 * 
 * Default value: false
 * 
 * @param {Boolean}
 *            enableCollisionDetection - Experimental feature which avoids
 *            overlapping of nodes in the graph. In order to use this feature as
 *            good as possible all nodes should have a radius property.
 * 
 * Default value: false
 * 
 * @param {Function}
 *            nodeFactory - This optional factory function can be used to define
 *            the node layout individually. The function passed gets the 'node'
 *            SVG Element placeholder and has to return the Element to append.
 *            This enables to create more complex nodes like images or layout
 *            container with labeled images. For CSS styling the class 'node'
 *            should be created as all nodes are assigned to it by default.
 * 
 * Default: nodes are rendered as simple circles.
 * 
 * @param {Function}
 *            linkFactory - This optional factory function can be used to define
 *            the link layout individually. The function passed gets the 'link'
 *            SVG Element placeholder and has to return the Element to append.
 *            For CSS styling the class 'link' should be created as all links
 *            are assigned to it by default.
 * 
 * Default: links are rendered as simple lines.
 * 
 * @param {Function}
 *            mouseOver - This event is fired whenever the mouse enters the
 *            ForceDirectedGraph control area at any position. The given
 *            function will be called with the ForceDirectedGraph as context
 *            (this). The d3 node- and linkSelection will be part of the event
 *            parameter in order to allow visual manipulations. Attention: Since
 *            this listener is attached to the whole control it gets called in
 *            case of node or link related events, too. In order to prevent
 *            event bubbling call d3.event.stopPropagation() from lower events.<br>
 *            Example: <code>
 *                mouseOver : function(oEvent) {
 *                    var nodeSelection = oEvent.getParamenter("nodeSelection");
 *                    var linkSelection = oEvent.getParameter("linkSelection");
 *                },
 *            </code>
 * 
 * @param {Function}
 *            mouseMove - This event is fired whenever the mouse moves over the
 *            ForceDirectedGraph control area at any position. The given
 *            function will be called with the ForceDirectedGraph as context
 *            (this). The d3 node- and linkSelection will be part of the event
 *            parameter in order to allow visual manipulations. Attention: Since
 *            this listener is attached to the whole control it gets called in
 *            case of node or link related events, too. In order to prevent
 *            event bubbling call d3.event.stopPropagation() from lower events.<br>
 *            Example: <code>
 *                mouseMove : function(oEvent) {
 *                    var nodeSelection = oEvent.getParamenter("nodeSelection");
 *                    var linkSelection = oEvent.getParameter("linkSelection");
 *                },
 *            </code>
 * 
 * @param {Function}
 *            mouseOut - This event is fired whenever the mouse moves out of the
 *            ForceDirectedGraph control area. The given function will be called
 *            with the ForceDirectedGraph as context (this). The d3 node- and
 *            linkSelection will be part of the event parameter in order to
 *            allow visual manipulations. Attention: Since this listener is
 *            attached to the whole control it gets called in case of node or
 *            link related events, too. In order to prevent event bubbling call
 *            d3.event.stopPropagation() from lower events.<br>
 *            Example: <code>
 *                mouseOut : function(oEvent) {
 *                    var nodeSelection = oEvent.getParamenter("nodeSelection");
 *                    var linkSelection = oEvent.getParameter("linkSelection");
 *                },
 *            </code>
 * 
 * @param {Function}
 *            press - This event is fired whenever the ForceDirectedGraph
 *            control gets clicked at any position. The given function will be
 *            called with the ForceDirectedGraph as context (this). The d3 node-
 *            and linkSelection will be part of the event parameter in order to
 *            allow visual manipulations. Attention: Since this listener is
 *            attached to the whole control it gets called in case of node or
 *            link related events, too. In order to prevent event bubbling call
 *            d3.event.stopPropagation() from lower events.<br>
 *            Example: <code>
 *                press : function(oEvent) {
 *                    var nodeSelection = oEvent.getParamenter("nodeSelection");
 *                    var linkSelection = oEvent.getParameter("linkSelection");
 *                },
 *            </code>
 * 
 * 
 * @param {Function}
 *            nodeMouseOver - This event is fired whenever the mouse enters a
 *            node. The given function will be called with the
 *            ForceDirectedGraph as context (this) and the node as event
 *            parameter. In addition the d3 node- and linkSelection will be part
 *            of the event parameter in order to allow visual manipulations.<br>
 *            Example: <code>
 *                nodeMouseOver : function(oEvent) {
 *                    var node = oEvent.getParameter("node");
 *                    var nodeSelection = oEvent.getParamenter("nodeSelection");
 *                    var linkSelection = oEvent.getParameter("linkSelection");
 *                },
 *            </code>
 * 
 * @param {Function}
 *            nodeMouseMove - This event is fired while the mouse is moving over
 *            a node. The given function will be called with the
 *            ForceDirectedGraph as context (this) and the node as event
 *            parameter. In addition the d3 node- and linkSelection will be part
 *            of the event parameter in order to allow visual manipulations.<br>
 *            Example: <code>
 *                nodeMouseMove : function(oEvent) {
 *                    var node = oEvent.getParameter("node");
 *                    var nodeSelection = oEvent.getParamenter("nodeSelection");
 *                    var linkSelection = oEvent.getParameter("linkSelection");
 *                },
 *            </code>
 * 
 * @param {Function}
 *            nodeMouseOut - This event is fired when the mouse moves out of a
 *            node. The given function will be called with the
 *            ForceDirectedGraph as context (this) and the node as event
 *            parameter. In addition the d3 node- and linkSelection will be part
 *            of the event parameter in order to allow visual manipulations.<br>
 *            Example: <code>
 *                nodeMouseOut : function(oEvent) {
 *                    var node = oEvent.getParameter("node");
 *                    var nodeSelection = oEvent.getParamenter("nodeSelection");
 *                    var linkSelection = oEvent.getParameter("linkSelection");
 *                },
 *            </code>
 * 
 * @param {Function}
 *            nodePress - This event is fired whenever a node gets clicked. The
 *            given function will be called with the ForceDirectedGraph as
 *            context (this) and the node as event parameter. In addition the d3
 *            node- and linkSelection will be part of the Event Parameter in
 *            order to allow visual manipulations.<br>
 *            Example: <code>
 *                nodePress : function(oEvent) {
 *                    var node = oEvent.getParameter("node");
 *                    var nodeSelection = oEvent.getParamenter("nodeSelection");
 *                    var linkSelection = oEvent.getParameter("linkSelection");
 *                }
 *            </code>
 * 
 * @param {Function}
 *            linkMouseOver - This event is fired whenever the mouse enters a
 *            link. The given function will be called with the
 *            ForceDirectedGraph as context (this) and the link as event
 *            parameter. In addition the d3 node- and linkSelection will be part
 *            of the event parameter in order to allow visual manipulations.<br>
 *            Example: <code>
 *                linkMouseOver : function(oEvent) {
 *                    var link = oEvent.getParameter("link");
 *                    var nodeSelection = oEvent.getParamenter("nodeSelection");
 *                    var linkSelection = oEvent.getParameter("linkSelection");
 *                }
 *            </code>
 * 
 * @param {Function}
 *            linkMouseMove - This event is fired whenever the mouse is moving
 *            over a link. The given function will be called with the
 *            ForceDirectedGraph as context (this) and the link as event
 *            parameter. In addition the d3 node- and linkSelection will be part
 *            of the event parameter in order to allow visual manipulations.<br>
 *            Example: <code>
 *                linkMouseMove : function(oEvent) {
 *                    var link = oEvent.getParameter("link");
 *                    var nodeSelection = oEvent.getParamenter("nodeSelection");
 *                    var linkSelection = oEvent.getParameter("linkSelection");
 *                }
 *            </code>
 * 
 * @param {Function}
 *            linkMouseOut - This event is fired whenever the mouse moves out of
 *            a link. The given function will be called with the
 *            ForceDirectedGraph as context (this) and the link as event
 *            parameter. In addition the d3 node- and linkSelection will be part
 *            of the event parameter in order to allow visual manipulations.<br>
 *            Example: <code>
 *                linkMouseOut : function(oEvent) {
 *                    var link = oEvent.getParameter("link");
 *                    var nodeSelection = oEvent.getParamenter("nodeSelection");
 *                    var linkSelection = oEvent.getParameter("linkSelection");
 *                }
 *            </code>
 * 
 * @param {Function} -
 *            linkPress - This event is fired whenever a link gets clicked. The
 *            given function will be called with the ForceDirectedGraph as
 *            context (this) and the link as event parameter. In addition the d3
 *            node- and linkSelection will be part of the event parameter in
 *            order to allow visual manipulations.<br>
 *            Example: <code>
 *                linkPress : function(oEvent) {
 *                    var link = oEvent.getParameter("link");
 *                    var nodeSelection = oEvent.getParamenter("nodeSelection");
 *                    var linkSelection = oEvent.getParameter("linkSelection");
 *                }
 *            </code>
 * 
 * @param {sap.secmon.ui.commons.controls.Tooltip} -
 *            tooltip - This aggregation can be used to extend the
 *            Force-Directed Graph with a simple tooltip. Only a
 *            sap.secmon.ui.commons.controls.Tooltip is allowed. If provided,
 *            the Force-Directed Graph controls the tooltip position and
 *            visibility itself. Set the content of the tooltip by providing
 *            sap.secmon.ui.commons.controls.TooltipItems to the items
 *            aggregation of the Tooltip. Attach an event listener to the
 *            <code>beforeShow</code> event of the Tooltip as a hook to set
 *            the content depending on the source triggering the tooltip.
 * 
 * @example <code>
 *      jQuery.sap.require("sap.secmon.ui.commons.controls.ForceDirectedGraph");
 * 
 *      var forceDirectedGraph = new sap.secmon.ui.commons.controls.ForceDirectedGraph({
 *              width : "600px",
 *              height : "600px",
 *              nodes : [{},{}],
 *              links : [{ source: 0, target: 1 }]
 *      }).start();
 *
 * <code>
 *
 */

sap.secmon.ui.commons.controls.ForceDirectedGraph = (function() {

    /** Get custom d3 version within local context */
    /**
     * Uncomment to enable custom d3 usage. <code>
    var d3 = (function() {
        var localContext = {};

        // create define in this scope to avoid collision in cases
        // where requireJS is used
        var define = false;

        jQuery.ajax({
            url : "lib/d3.js",
            dataType : 'text',
            async : false
        }).done(function(oResponse) {
            eval(oResponse.substr(0, oResponse.length - 3) + ".call(localContext);");
        });

        return localContext.d3;
    }());
     * </code>
     */

    /**
     * Use d3 from SAPUI5
     */
    jQuery.sap.require("sap.ui.thirdparty.d3");

    var ForceDirectedGraph = sap.ui.core.Control.extend("sap.secmon.ui.commons.controls.ForceDirectedGraph", {
        metadata : {

            properties : {
                nodes : {
                    type : "object[]",
                    defaultValue : []
                },
                links : {
                    type : "object[]",
                    defaultValue : []
                },
                enableDragging : {
                    type : "boolean",
                    defaultValue : true
                },
                linkStrength : {
                    type : "any",
                    defaultValue : 1
                },
                linkDistance : {
                    type : "any",
                    defaultValue : 20
                },
                friction : {
                    type : "number",
                    defaultValue : 0.9
                },
                charge : {
                    type : "any",
                    defaultValue : -30
                },
                alpha : {
                    type : "number",
                    defaultValue : 0.1
                },
                theta : {
                    type : "number",
                    defaultValue : 0.8
                },
                gravity : {
                    type : "number",
                    defaultValue : 0.1
                },
                width : {
                    type : "sap.ui.core.CSSSize",
                    defaultValue : "100%"
                },
                height : {
                    type : "sap.ui.core.CSSSize",
                    defaultValue : "400px"
                },
                nodeFactory : {
                    type : "any",
                    defaultValue : {}
                },
                linkFactory : {
                    type : "any",
                    defaultValue : {}
                },
                showLegend : {
                    type : "boolean",
                    defaultValue : false
                },
                enableCollisionDetection : {
                    type : "boolean",
                    defaultValue : false
                }
            },

            aggregations : {
                tooltip : {
                    type : "sap.secmon.ui.commons.controls.Tooltip",
                    multiple : false
                },
                legend : {
                    type : "sap.secmon.ui.commons.controls.Legend",
                    multiple : false
                }
            },

            events : {
                "press" : {
                    enablePreventDefault : false
                },
                "mouseOver" : {
                    enablePreventDefault : false
                },
                "mouseMove" : {
                    enablePreventDefault : false
                },
                "mouseOut" : {
                    enablePreventDefault : false
                },
                "nodeMouseOver" : {
                    enablePreventDefault : false
                },
                "nodeMouseMove" : {
                    enablePreventDefault : false
                },
                "nodeMouseOut" : {
                    enablePreventDefault : false
                },
                "nodePress" : {
                    enablePreventDefault : false
                },
                "linkMouseOver" : {
                    enablePreventDefault : false
                },
                "linkMouseMove" : {
                    enablePreventDefault : false
                },
                "linkMouseOut" : {
                    enablePreventDefault : false
                },
                "linkPress" : {
                    enablePreventDefault : false
                }
            }
        },

        init : function() {
            this._force = d3.layout.force();
        },

        onAfterRendering : function() {
            if (!this._sResizeHandlerId) {
                this._sResizeHandlerId = sap.ui.core.ResizeHandler.register(this.getParent(), jQuery.proxy(this._onResize, this));
            }

            // update force layout if rendering is necessary. otherwise resize
            // listener will start.
            if (this._getWidthInPixels() > 0 && this._getHeightInPixels() > 0) {
                this.start();
            }
        },

        /** maximum legend content width in px */
        _LEGEND_WIDTH : 190,

        _DEFAULT_NODE_RADIUS : 7,

        /**
         * Resize handler to adapt the control the new parent dimensions.
         */
        _onResize : function(oEvent) {
            if (oEvent.size.height === 0 || oEvent.size.width === 0) {
                // parent container was probably removed.
                // No updates required.
                return;
            }

            if (oEvent.oldSize.height === 0 || oEvent.oldSize.width === 0) {
                // parent finished initial rendering. we can adjust the %-size
                // now.
                this.start();
            }

            var realHeight = this._getHeightInPixels();
            var svgWidth = this._calculateSvgWidth();

            // update svg dimensions
            d3.select("#" + this._getSvgId()).attr("width", svgWidth + "px").attr("height", realHeight + "px");

            // release sticky nodes to avoid nodes leaving visible area
            this._releaseNodes();

            // update force dimensions
            this._force.size([ svgWidth, realHeight ]).resume();

            // hide tooltip
            if (this.getTooltip()) {
                this._tooltipFixed = false;
                this._hideTooltip();
            }
        },

        /**
         * Removes the fixed property of all nodes in order to include them in
         * the simulation again.
         */
        _releaseNodes : function() {
            this._force.nodes().forEach(function(n) {
                n.fixed = false;
            });
        },

        // Gets or creates a SVG if not already rendered
        _getSvg : function() {
            var svgSelection = d3.select("#" + this._getSvgId());
            if (svgSelection.empty()) {
                return this._createSvg();
            }
            return svgSelection;

        },

        _createSvg : function() {
            return d3.select('#' + this._getGraphId()).append('svg').attr("id", this._getSvgId()).attr('width', this._calculateSvgWidth()).attr('height', this._getHeightInPixels()).style("display",
                    "block").style("margin", "auto").style("float", "left");
        },

        _removeSvg : function() {
            d3.select("#" + this._getSvgId()).remove();
        },

        /**
         * Calculates the width for SVG and force layout depending on whether
         * the legend area is currently enabled or not. Prevents 0px-width in
         * order to avoid SVG crashes.
         */
        _calculateSvgWidth : function() {
            var controlWidth = this._getWidthInPixels();
            var scrollBarWidth = 16; // estimated width of scrollbars
            var svgWidth = this.getShowLegend() ? controlWidth - this._LEGEND_WIDTH - scrollBarWidth : controlWidth;
            return svgWidth > 1 ? svgWidth : 1;
        },

        _getSvgId : function() {
            return this.getId() + "_svg";
        },

        _getGraphId : function() {
            return this.getId() + "_graph";
        },

        /**
         * Calculates the width in pixels even if %-values are given. This is
         * necessary since SVG and Force layout need real pixel values in all
         * cases.
         */
        _getWidthInPixels : function() {
            var width = this.getWidth();
            var pixels = parseInt(width.substring(0, width.indexOf("px")));
            return isNaN(pixels) ? ((this.getParent().$()[0].clientWidth) / 100 * parseInt(width.substring(0, width.indexOf("%")))) : (pixels);
        },

        /**
         * Calculates the height in pixels even if %-values are given. This is
         * necessary since SVG and Force layout need real pixel values in all
         * cases.
         */
        _getHeightInPixels : function() {
            var height = this.getHeight();
            var pixels = parseInt(height.substring(0, height.indexOf("px")));
            return isNaN(pixels) ? ((this.getParent().$()[0].clientHeight) / 100 * parseInt(height.substring(0, height.indexOf("%")))) : (pixels);
        },

        _draw : function() {
            var control = this;

            if (this.getNodes().length === 0) {
                this._showNoDataIndicator();
                return;
            }

            this._force.size([ this._calculateSvgWidth(), this._getHeightInPixels() ]);
            this._force.nodes(this.getNodes());
            this._force.links(this.getLinks());
            this._force.linkStrength(this.getLinkStrength());
            this._force.friction(this.getFriction());
            this._force.linkDistance(this.getLinkDistance());
            this._force.charge(this.getCharge());
            this._force.gravity(this.getGravity());
            this._force.theta(this.getTheta());
            this._force.alpha(this.getAlpha());

            /**
             * RENDER LINKS
             */
            this._linkSelection = {};
            var svg = this._getSvg();
            var linkEnterSelection = svg.selectAll('.link').data(this.getLinks()).enter();
            var linkFactory = this.getLinkFactory();
            if (typeof linkFactory === "function") {
                this._linkSelection = linkFactory(linkEnterSelection);
                if (!(this._linkSelection instanceof d3.selection)) {
                    throw new Error("Missing or invalid return value from linkFactory.");
                }
            } else {
                var linkUpdateSelection = svg.selectAll('.link').data(this.getLinks());
                var linkExitSelection = linkUpdateSelection.exit();

                // render entries on 'enter' stage
                this._linkSelection = linkEnterSelection.append('line').attr('class', 'link');

                // remove entries on 'exit' stage
                linkExitSelection.remove();
            }

            /**
             * RENDER NODES
             */
            this._nodeSelection = {};
            var nodeEnterSelection = svg.selectAll('.node').data(this.getNodes()).enter();
            var nodeFactory = this.getNodeFactory();

            if (typeof nodeFactory === "function") {
                this._nodeSelection = nodeFactory(nodeEnterSelection);
                if (!(this._nodeSelection instanceof d3.selection)) {
                    throw new Error("Missing or invalid return value from nodeFactory.");
                }
            } else {
                var nodeUpdateSelection = svg.selectAll('.node').data(this.getNodes());
                var nodeExitSelection = nodeUpdateSelection.exit();

                // render entries on 'enter' stage
                this._nodeSelection = nodeEnterSelection.append("circle").attr("r", this._DEFAULT_NODE_RADIUS).attr("class", "node");

                // remove entries on 'exit' stage
                nodeExitSelection.remove();
            }

            function dragend(d) {
                control._dragging = false;
            }

            function dragstart(d) {
                control._dragging = true;
                // silence other listeners
                d3.event.sourceEvent.stopPropagation();
                d.fixed = true;
                control._hideTooltip();
            }

            if (this.getEnableDragging()) {                

                var drag = this._force.drag().on("dragstart", dragstart).on("dragend", dragend);

                this._nodeSelection.call(drag);
            }

            /*
             * ATTACH SVG RELATED EVENTS:
             */
            svg.on("click", function() {
                // release tooltip fixing
                control._tooltipFixed = false;
                control._hideTooltip();

                if (control._selectedNode) {
                    delete control._selectedNode.tooltipX;
                    delete control._selectedNode.tooltipY;
                }
                delete control._selectedNode;

                control.firePress({
                    nodeSelection : control._nodeSelection,
                    linkSelection : control._linkSelection
                });
            });

            // corresponding click event for touch devices
            svg.on("touchend", function() {
                // release tooltip fixing
                control._tooltipFixed = false;
                control._hideTooltip();

                if (control._selectedNode) {
                    delete control._selectedNode.tooltipX;
                    delete control._selectedNode.tooltipY;
                }
                delete control._selectedNode;
                control.firePress({
                    nodeSelection : control._nodeSelection,
                    linkSelection : control._linkSelection
                });
            });

            svg.on("mouseover", function() {
                control.fireMouseOver({
                    nodeSelection : control._nodeSelection,
                    linkSelection : control._linkSelection
                });
            });

            svg.on("mousemove", function() {
                control.fireMouseMove({
                    nodeSelection : control._nodeSelection,
                    linkSelection : control._linkSelection
                });
            });

            svg.on("mouseout", function() {
                control.fireMouseOut({
                    nodeSelection : control._nodeSelection,
                    linkSelection : control._linkSelection
                });
            });

            /*
             * ATTACH LINK RELATED EVENTS:
             */
            this._linkSelection.on("mouseover", function(l) {
                control.fireLinkMouseOver({
                    link : l,
                    nodeSelection : control._nodeSelection,
                    linkSelection : control._linkSelection
                });
            });

            this._linkSelection.on("mousemove", function(l) {
                control.fireLinkMouseMove({
                    link : l,
                    nodeSelection : control._nodeSelection,
                    linkSelection : control._linkSelection
                });
            });

            this._linkSelection.on("mouseout", function(l) {
                control.fireLinkMouseOut({
                    link : l,
                    nodeSelection : control._nodeSelection,
                    linkSelection : control._linkSelection
                });
            });

            this._linkSelection.on("click", function(l) {
                control.fireLinkPress({
                    link : l,
                    nodeSelection : control._nodeSelection,
                    linkSelection : control._linkSelection
                });
            });

            // corresponding click for touch devices
            this._linkSelection.on("touchend", function(l) {
                control.fireLinkPress({
                    link : l,
                    nodeSelection : control._nodeSelection,
                    linkSelection : control._linkSelection
                });
            });

            /*
             * ATTACH NODE RELATED EVENTS
             */
            this._nodeSelection.on("mouseover", function(n, i) {
                control._showTooltip(n);

                control._updateTooltipPosition(n);

                control.fireNodeMouseOver({
                    node : n,
                    nodeSelection : control._nodeSelection,
                    linkSelection : control._linkSelection
                });
            });

            this._nodeSelection.on("mousemove", function(n) {

                if (!(control._tooltipFixed && control._selectedNode === n)) {
                    // move tooltip except when tooltip is fixed and mousemove
                    // is on
                    // that fixed node
                    control._updateTooltipPosition(n);
                }

                control.fireNodeMouseMove({
                    node : n,
                    nodeSelection : control._nodeSelection,
                    linkSelection : control._linkSelection
                });
            });

            this._nodeSelection.on("mouseout", function(n) {

                if (!control._tooltipFixed || (control._tooltipFixed && (control._selectedNode !== n))) {
                    // hide tooltip except when it is currently fixed,
                    // but hide if tooltip is fixed and mouseout is on another
                    // node
                    control._hideTooltip();
                }

                control.fireNodeMouseOut({
                    node : n,
                    nodeSelection : control._nodeSelection,
                    linkSelection : control._linkSelection
                });
            });

            this._nodeSelection.on("click", function(n) {
                if (d3.event.defaultPrevented) {
                    return; // click suppressed, e.g. on drag
                }

                if (control._selectedNode && control._selectedNode !== n) {
                    delete control._selectedNode.tooltipX;
                    delete control._selectedNode.tooltipY;
                }
                control._tooltipFixed = true;
                control._showTooltip(n);
                control._selectedNode = n;
                control._updateTooltipPosition(n);

                control.fireNodePress({
                    node : n,
                    nodeSelection : control._nodeSelection,
                    linkSelection : control._linkSelection
                });
            });

            // corresponding click event for touch devices
            this._nodeSelection.on("touchend", function(n) {
                if (control._selectedNode && control._selectedNode !== n) {
                    delete control._selectedNode.tooltipX;
                    delete control._selectedNode.tooltipY;
                }
                control._tooltipFixed = true;
                control._selectedNode = n;
                control._updateTooltipPosition(n);
                control._showTooltip(n);

                control.fireNodePress({
                    node : n,
                    nodeSelection : control._nodeSelection,
                    linkSelection : control._linkSelection
                });
                d3.event.preventDefault();
                d3.event.stopPropagation();
            });

            // make sure to get notified if close button is pressed
            // and do the same action as svg press.
            if (this.getTooltip()) {
                this.getTooltip().attachBeforeClose(function() {
                    // release tooltip fixing
                    control._tooltipFixed = false;
                    control._hideTooltip();

                    delete this._selectedNode;
                    control.firePress({
                        nodeSelection : control._nodeSelection,
                        linkSelection : control._linkSelection
                    });
                });
            }

            // Attach tick animation
            this._force.on("tick", function(e) {
                var w = control._force.size()[0];
                var h = control._force.size()[1];
                var defaultRadius = control._DEFAULT_NODE_RADIUS;

                if (control.getEnableCollisionDetection()) {
                    var nodes = control.getNodes();
                    var q = d3.geom.quadtree(nodes), i = 0, n = nodes.length;

                    while (++i < n) {
                        q.visit(control._collide(nodes[i]));
                    }
                }

                control._nodeSelection.attr("transform", function(d) {
                    // Consider 'centered' property
                    if (d.centered) {
                        d.x = w / 2;
                        d.y = h / 2;
                    }

                    // limit x/y coordinates to min/max of force layout
                    var radius = d.radius || defaultRadius;
                    d.x = Math.max(radius, Math.min(w - radius, d.x)) || 0;
                    d.y = Math.max(radius, Math.min(h - radius, d.y)) || 0;
                    return "translate(" + d.x + "," + d.y + ")";
                });

                control._linkSelection.attr("x1", function(d) {
                    return d.source.x;
                }).attr("y1", function(d) {
                    return d.source.y;
                }).attr("x2", function(d) {
                    return d.target.x;
                }).attr("y2", function(d) {
                    return d.target.y;
                });
            });
        },

        /**
         * Returns the necessary callback function suitable for a call of
         * d3.quadtree.visit which visits each node invoking this callback.
         */
        _collide : function(node) {
            var defaultRadius = this._DEFAULT_NODE_RADIUS;
            var r = (node.radius || defaultRadius) + 16, nx1 = node.x - r, nx2 = node.x + r, ny1 = node.y - r, ny2 = node.y + r;
            return function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== node)) {
                    var x = node.x - quad.point.x, y = node.y - quad.point.y, l = Math.sqrt(x * x + y * y), r = (node.radius || defaultRadius) + (quad.point.radius || defaultRadius);
                    if (l < r) {
                        l = (l - r) / l * 0.5;
                        node.x -= x *= l;
                        node.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            };
        },

        /**
         * Opens the tooltip by setting its visibility to true and fires the
         * beforeShow event of the tooltip in order to notify listeners to
         * change the tooltip content.
         */
        _showTooltip : function(oSource) {
            if (this._dragging === true) {
                return;
            }

            var oTooltip = this.getTooltip();

            if (!oTooltip) {
                return;
            }

            oTooltip.fireBeforeShow({
                source : oSource
            });

            window.setTimeout(function() {
                oTooltip.setVisible(true);
            }, 0);

        },

        _hideTooltip : function() {
            var oTooltip = this.getTooltip();
            if (oTooltip) {
                oTooltip.setVisible(false);
            }
        },

        /**
         * Updates the tooltip position according to the current d3 event.
         */
        _updateTooltipPosition : function(oSource) {
            var oTooltip = this.getTooltip();

            if (!oTooltip) {
                return;
            }

            // explicit test for existence of TouchEvent for Firefox
            // with typeof operator is necessary here
            if (typeof TouchEvent !== "undefined" && d3.event instanceof TouchEvent) {
                oTooltip.setLeft(oSource.x + 30).setTop(oSource.y + 30);
                return;
            }

            var graphOffset = jQuery("#" + this._getGraphId()).offset();
            var tooltipX = d3.event.pageX - graphOffset.left;
            var tooltipY = d3.event.pageY - graphOffset.top;

            // if you hover over the selected node the tooltip shall be sticky
            // therefore the position is only calculated once
            if (this._selectedNode === oSource && this._tooltipFixed === true) {
                if (!oSource.hasOwnProperty("tooltipX") && !oSource.hasOwnProperty("tooltipY")) {
                    oSource.tooltipX = tooltipX;
                    oSource.tooltipY = tooltipY;

                }
                tooltipX = oSource.tooltipX;
                tooltipY = oSource.tooltipY;
            }

            // async placement in order to prevent placement algorithm to run
            // before new content was injected and rendered. This fixes the
            // slightly wrong positions of the tooltip in cases where different
            // node types are selected.
            window.setTimeout(function() {
                oTooltip.placeAt(tooltipY, tooltipX);
            }, 0);
        },

        _showNoDataIndicator : function() {
            var width = this._getWidthInPixels();
            var height = this._getHeightInPixels();
            this._removeSvg();

            // horizontal center:
            var x = width / 2;
            // vertical center + 25% up:
            var y = height / 2 - (height * 0.25);

            this._createSvg().append("text").text("No data").attr("text-anchor", "middle").attr("x", x).attr("y", y);
        }

    });

    /**
     * Renders the graph according to its properties and starts the simulation.
     * This method call is mandatory.
     * 
     * @return this to allow chaining
     */
    sap.secmon.ui.commons.controls.ForceDirectedGraph.prototype.start = function() {
        this._draw();
        this._force.start();
        return this;
    };

    /**
     * Terminates the simulation immediately at its current state. This can be
     * used to stop the simulation explicitly, for example, if you want to show
     * animation or allow other interaction. If you do not stop the layout
     * explicitly, it will still stop automatically after the layout's cooling
     * parameter decays below some threshold.
     * 
     * @return this to allow chaining
     */
    sap.secmon.ui.commons.controls.ForceDirectedGraph.prototype.stop = function() {
        this._force.stop();
        return this;
    };

    /**
     * Resumes the simulation by setting the internal cooling parameter (alpha)
     * to 0.1.
     * 
     * @return this to allow chaining
     */
    sap.secmon.ui.commons.controls.ForceDirectedGraph.prototype.resume = function() {
        this._force.resume();
        return this;
    };

    /**
     * Runs the simulation exactly one step. In order to generate a static force
     * layout without initial visible transformations combine start, tick
     * (n-times) and stop.
     * 
     * @return this to allow chaining
     */
    sap.secmon.ui.commons.controls.ForceDirectedGraph.prototype.tick = function() {
        this._force.tick();
        return this;
    };

    /**
     * Stops the simulation and shows the noDataIndicator. All settings done to
     * the ForceDirectedGraph control are still available. Calling start() will
     * redraw the Graph with all previous settings.
     * 
     * @return this to allow chaining
     */
    sap.secmon.ui.commons.controls.ForceDirectedGraph.prototype.clear = function() {
        this.stop();
        if (this.getParent().$().length > 0) {
            this._showNoDataIndicator();
        }
        return this;
    };

    /**
     * Returns the current selected Node, undefined if no node is selected.
     */
    sap.secmon.ui.commons.controls.ForceDirectedGraph.prototype.getSelectedNode = function() {
        return this._selectedNode;
    };

    /**
     * Returns the d3 force-layout object used by this control instance to
     * enable native API access.
     */
    sap.secmon.ui.commons.controls.ForceDirectedGraph.prototype.getForceLayout = function() {
        return this._force;
    };

    /** Override setter in order to prevent invalidation of the whole control. */
    sap.secmon.ui.commons.controls.ForceDirectedGraph.prototype.setShowLegend = function(bShowLegend) {

        // update inner property without invalidating and thus rerendering the
        // control:
        this.setProperty("showLegend", bShowLegend, /* suppress invalidate */true);

        if (jQuery("#" + this.getId() + "_legend").length === 0) {
            // initial rendering is not completed
            return;
        }

        var newForceWidth;
        if (!bShowLegend) {
            // hide legend by moving it out the visible area
            jQuery("#" + this.getId() + "_legend").animate({
                right : "-" + this._LEGEND_WIDTH + "px"
            }, 300, 'linear');

            // full size for force and svg
            newForceWidth = this._getWidthInPixels();
        } else {
            // show legend

            // make sure that container has necessary width
            jQuery("#" + this.getId() + "_legend").width(this._LEGEND_WIDTH);

            jQuery("#" + this.getId() + "_legend").animate({
                right : "0px",
            }, 300, 'linear');

            // set reduced size for force and svg
            newForceWidth = this._getWidthInPixels() - this._LEGEND_WIDTH;
        }

        this._releaseNodes();
        this._force.size([ newForceWidth, this._getHeightInPixels() ]);
        d3.select("#" + this._getSvgId()).attr("width", newForceWidth + "px");

        // call resume in order to force the layout to move to the new position
        // and to prevent 'lazy nodes'.
        this._force.resume();

        // return this to allow chaining
        return this;
    };

    ForceDirectedGraph.prototype.d3 = d3;

    return ForceDirectedGraph;

}());