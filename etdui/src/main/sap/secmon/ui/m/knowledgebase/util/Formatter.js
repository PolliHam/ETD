jQuery.sap.declare("sap.secmon.ui.m.knowledgebase.util.Formatter");

sap.secmon.ui.m.knowledgebase.util.Formatter = {

    /**
     * Formatter to make copy and delete buttons to be visible, depending upon if the user has the knowledgeBaseeWrite privilege and the event is editable
     * 
     * @see EventDetail.view.xml, LogTypesDetail.view.xml
     */
    formatVisibility : function(bWritable, sEditable) {
        return bWritable && sEditable === 'true';
    }
};