jQuery.sap.require("sap.secmon.ui.m.commons.SelectionUtils");
jQuery.sap.require("sap.m.Table");

describe("SelectionUtils", function() {
    describe("selectItems", function() {
        
        var oTable;
        
        beforeEach(function() {
            var oData = [ {
                id : "qqo="
            }, {
                id : "u7s="
            }, {
                id : "zMw="
            } ]; // base 64 encoded ids (HEX: AAAA, BBBB, CCCC)
            var oModel = new sap.ui.model.json.JSONModel(oData);
            oTable = new sap.m.Table({
                columns : [ new sap.m.Column() ],
                mode : sap.m.ListMode.MultiSelect
            });
            var oTemplate = new sap.m.ColumnListItem({
                cells : [ new sap.m.Text({
                    text : "{id}"
                }) ]
            });
            oTable.setModel(oModel);
            oTable.bindItems("/", oTemplate);
        });

        it("should select rows AAAA and BBBB, and return selected context(s)", function() {
            sap.secmon.ui.m.commons.SelectionUtils.selectItems([ "AAAA", "BBBB" ], oTable, "id");
            var aContexts = oTable.getSelectedContexts();
            expect(aContexts.length).toBe(2);
            var aExpectedIds = ["qqo=", "u7s="];
            expect(aExpectedIds).toContain(aContexts[0].getProperty("id"));
            expect(aExpectedIds).toContain(aContexts[1].getProperty("id"));
            
            var aSelectedContexts = sap.secmon.ui.m.commons.SelectionUtils.getSelectedContexts(oTable);
            expect(aSelectedContexts.length).toBe(2);
            expect(aExpectedIds).toContain(aSelectedContexts[0].getProperty("id"));
            expect(aExpectedIds).toContain(aSelectedContexts[1].getProperty("id"));
            
            var aSelectedContext = sap.secmon.ui.m.commons.SelectionUtils.getSelectedContext(oTable);
            expect(aSelectedContext.getProperty("id")).toBe("qqo=");
        });
        
        
        

    });

});
