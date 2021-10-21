const VariableRankView = require('./variable-rank-view');

class VariableRankListView {
  constructor(varDefs) {
    this.$element = $('<div></div>')
      .addClass('variable-rank-list');

    this.variableRankViews = Object.fromEntries(
      Object.entries(varDefs)
        .map(([id, def]) => [id, new VariableRankView(id, def)])
    );

    this.$element.append(
      $('<div></div>').addClass('variables')
        .append(...Object.values(this.variableRankViews).map(view => view.$element))
    );
  }

  set(varValues) {
    Object.entries(varValues).forEach(([id, value]) => {
      if (this.variableRankViews[id] !== undefined) {
        this.variableRankViews[id].setValue(value);
      }
    });
  }
}

module.exports = VariableRankListView;
