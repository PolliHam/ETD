sap.ui.define([
	"sap/ui/test/Opa5",
	"test/apps/Namespace/pages/Common"
], function (Opa5, Common) {
	"use strict";

	var sViewName = "Namespaces";

	Opa5.createPageObjects({
		onTheNamespacePage: {
			baseClass: Common,
			actions: {},

			assertions: {
				iShouldSeePage: function () {
					return this.waitFor({
						id: "page",
						viewName: sViewName,
						success: function (oPage) {
							assert.ok(oPage, "Namespace page opened");
						}
					});
				},
                iShouldSeeList: function () {
                    return this.waitFor({
                        id: "patternsTable",
                        viewName: sViewName,
                        success: function (oPage) {
                            assert.ok(oPage, "Namespace Table exists");
                        }
                    });
                }
            }
		}
	});
});
