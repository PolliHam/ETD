jQuery.sap.declare("sap.secmon.ui.commons.HtmlUtils");
sap.secmon.ui.commons.HtmlUtils = {

    /*
     * clean up the HTML DOM: Remove all formatting but retain links and images @param inputNode input node containing original (possibly deep) DOM @param resultNode result node with flat structure
     * @return the result DOM node
     */
    cleanupHtmlDom : function(inputNode) {

        function _cleanupHtmlDomRecursive(iNode, rNode) {
            if (iNode.hasChildNodes()) {
                // depending on JS implementation, childNodes is an array or not
                Array.prototype.forEach.call(iNode.childNodes, function(child) {
                    if (child.nodeType === Node.TEXT_NODE) {
                        rNode.appendChild(child.cloneNode(false));
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        if (child.nodeName === 'A' || child.nodeName === 'IMG') {
                            rNode.appendChild(child.cloneNode(true));
                        } else {
                            rNode.appendChild(document.createTextNode(" "));
                            _cleanupHtmlDomRecursive(child, rNode);

                        }
                    } else {
                        _cleanupHtmlDomRecursive(child, rNode);
                    }
                });
            }
        }

        var resultNode = inputNode.cloneNode(false); // shallow copy
        _cleanupHtmlDomRecursive(inputNode, resultNode);
        return resultNode;
    }

};
