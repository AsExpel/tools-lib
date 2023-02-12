<template>
  <div class="component-table-page" :style="styleConfig">
    <el-card v-if="filterCard && !asideFilterCard"
             :shadow="styleConfig.useCardShadow || 'always'"
             :class="{'filter-card':true, 'header-filter-card': true, 'short-card': shortFilterCard}"
    >
      <template v-if="filterHeaderSlotKey">
        <template slot="header">
          <slot :name="filterHeaderSlotKey"></slot>
        </template>
      </template>
      <div class="filter-card-content">
        <slot :name="filterCard && !asideFilterCard ? 'filters' : 'hide-filters'"></slot>
      </div>
      <el-button :icon="shortFilterCard ? 'el-icon-download' : 'el-icon-upload2'" v-if="useShortFilter"
                 type="text" class="short-ctrl-btn" @click="handleShortFilterCard">
        {{shortFilterCard ? '展开' : '折叠'}}
      </el-button>
    </el-card>
    <div class="component-content">
      <el-row :gutter="styleConfig.gutter ? +styleConfig.gutter : 10" v-loading="usingLoading">
        <template v-if="asideCard">
          <el-col :span="styleConfig.spanLeft || 4">
            <el-card class="aside-card" v-bind="asideCardConfig" :shadow="styleConfig.useCardShadow || 'always'">
              <slot name="asideCard"></slot>
            </el-card>
          </el-col>
        </template>
        <el-col :span="asideCard ? (styleConfig.spanRight || 20) : 24">
          <template v-if="filterCard && asideFilterCard">
            <el-card :shadow="styleConfig.useCardShadow || 'always'"
                     :class="{'filter-card':true, 'header-aside-filter-card': true, 'short-card': shortFilterCard}"
            >
              <template v-if="filterHeaderSlotKey">
                <template slot="header">
                  <slot :name="filterHeaderSlotKey"></slot>
                </template>
              </template>
              <div class="filter-card-content">
                <slot :name="filterCard && asideFilterCard ? 'filters' : 'hide-filters'"></slot>
              </div>
              <el-button :icon="shortFilterCard ? 'el-icon-download' : 'el-icon-upload2'" v-if="useShortFilter"
                         type="text" class="short-ctrl-btn" @click="handleShortFilterCard">
                {{shortFilterCard ? '展开' : '折叠'}}
              </el-button>
            </el-card>
          </template>
          <el-card :class="{'content-card': true, 'has-aside': asideCard, 'use-table-scroll-bar':styleConfig.useTableScrollBar}" :shadow="styleConfig.useCardShadow || 'always'">
            <slot name="tableHeader"></slot>
            <el-table :data="tableData" v-bind="tableConfig" @cell-click="tableCellClick"
                      :ref="tableRowKey+ 'table'"
                      class="content-card-main-table"
                      @cell-dblclick="tableCellDBClick" stripe
                      @select-all="handleSelectAll"
                      @select="handleSelect"
            >
              <template v-for="(rowItem, rowIdx) in tableRowsConfig">
                <el-table-column v-if="!rowItem.rowSlotKey" v-bind="rowItem" :key="'slot'+tableRowKey+rowIdx">
                </el-table-column>
                <el-table-column v-else v-bind="rowItem" :key="tableRowKey+rowIdx">
                  <template slot-scope="scope">
                    <!--        动态绑定插槽            -->
                    <slot :name="rowItem.rowSlotKey" v-bind="scope"></slot>
                    <!--       插槽使用时可以通过 slot-scope="scope" 取值             -->
                    <!--如<template slot="operation" slot-scope="scope"></template>-->
                  </template>
                  <template slot="header" slot-scope="scope">
                    <template v-if="rowItem.rowHeaderSlotKey">
                      <slot :name="rowItem.rowHeaderSlotKey" v-bind="scope"></slot>
                    </template>
                    <template v-else>
                      {{rowItem.label || ''}}
                    </template>
                  </template>
                </el-table-column>
              </template>
            </el-table>
            <pagination
                v-if="!disablePagination"
                v-show="total>0"
                :page.sync="listQuery.pageNum"
                :limit.sync="listQuery.pageSize"
                :page-sizes="pageSizeList"
                :total="total" :auto-scroll="false"
                @pagination="currentChangeFn"
            />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination';
import {debounceTool} from "@/utils";
let mapIdx = 1;
/**
 * 表单页福音！现在统统可配置辣！
 * 主要配置项：
 * tableRowsConfig { Array } 表格列配置
 * 主要插槽（slot）：
 * filters 表头筛选项插槽
 */
/**
 * 样式预览
 * ![image-20230212203702268](https://lauro-simple-store.oss-cn-zhangjiakou.aliyuncs.com/image-20230212203702268.png)
 */
export default {
  name: "tablePage",
  components: {
    Pagination,
  },
  props: {
    // 是否渲染侧边插槽
    asideCard: {
      type: Boolean,
      default: false,
    },
    asideCardConfig: {
      type: Object,
      default: () => ({}),
    },
    // 是否渲染header插槽
    filterCard: {
      type: Boolean,
      default: true,
    },
    // header置于侧边插槽之右
    asideFilterCard: {
      type: Boolean,
      default: false,
    },
    // el-table 配置项
    tableConfig: {
      type: Object,
      default: () => ({
        border: true
      })
    },
    // 表格行配置，详细内容可参考默认数据，prop为列数据的key名，label为列名称
    tableRowsConfig: {
      type: Array,
      default: () => [
        {
          prop: 'prop',
          label: 'label',
          minWidth: '100',
          width: '150',
          align: 'center',
        },
        {
          prop: 'prop2',
          label: 'label2',
          minWidth: '100',
        },
        {
          prop: 'prop3',
          label: 'label3',
          width: '50',
          showOverflowTooltip: true,
          showTooltipWhenOverflow: false,
        },
        {
          label: '操作',
          width: '150',
          align: 'center',
          rowSlotKey: 'operation'
        },
      ]
    },
    // 配置样式 包括el-row的配置及css变量
    styleConfig: {
      type: Object,
      default: () => ({
        // spanLeft: 5,
        // spanRight: 19, // = 24 - spanLeft
        // gutter: 2,
        // '--component-padding': '0',
        // '--filter-card-margin-bottom': '2px',
        // useCardShadow: 'never',
      })
    },
    // request调用的函数名
    queryFunc: {
      type: String,
      required: true,
      default: 'test'
    },
    // 是否交由父处理返回数据 需要绑定 received 事件 入参即返回数据 需返回 {total, list, pageNum?, pageSize?}
    handleRes: {
      default: null
    },
    tableLoading: true,
    // 是否启用双击复制
    dblclickCopy: {
      type: Boolean,
      default: false
    },
    // 是否禁用分页
    disablePagination: {
      type: Boolean,
      default: false,
    },
    pageSizeList: {
      type: Array,
      default: () => [20, 30, 50]
    },
    // filter card header插槽名称
    filterHeaderSlotKey: {
      type: String,
      default: ''
    } ,
    // 已选中的行数组 当需要父级控制已选行的时候可使用，如获取已选择列表后回显等操作
    selectedList: {
      type: Array,
      default: () => []
    },
    useShortFilter: {type: Boolean, default: false}
  },
  data() {
    return {
      total: 0,
      listQuery: {
        // 页码
        pageNum: 1,
        // 条数
        pageSize: 20,
      },
      usingLoading: true,
      storeSearchParams: {},
      tableData: [],
      messageIsShow: true,
      checkedMap: new Map(),
      checkedMapBackup: new Map(),
      copyError: false,
      isInit: false,
      shortFilterCard: false,
    }
  },
  computed: {
    // 动态给列赋值，避免更新列时渲染错误
    tableRowKey() {
      const {length = 0} = this.tableRowsConfig;
      return 'row' + length
    }
  },
  created() {
    this.usingLoading = this.tableLoading ?? this.$options.props.tableLoading
  },
  mounted() {
    setTimeout(() => {
      this.messageIsShow = false;
    }, 500)
    this.canIUseCopy();
  },
  watch: {
    selectedList(newVal) {
      this.handleSelectAll(newVal, null, false);
    },
  },
  methods: {
    initPageSize() {
      if (this.pageSizeList?.length) {
        this.$set(this.listQuery, 'pageSize', this.pageSizeList[0]);
      }
    },
    // 提交查询 由外部父组件调用
    querySubmit({searchParams = {},searchType = ''}) {
      // console.log({searchParams})
      if (searchParams) {
        this.storeSearchParams = Object(searchParams);
      }
      switch (searchType) {
        case "refresh": {
          break;
        }
        case "reset": {
          // 重置搜索
        }
        case "search": {
          // 普通搜索 清除分页
          const {listQuery, total} = this.$options.data()
          this.listQuery = listQuery;
          this.total = total;
          this.initPageSize()
          this.cleanCheckedMap()
        }
      }
      this._tableScrollTop();
      this._queryData(searchParams)
    },
    _queryData(searchParams = this.storeSearchParams) {

      if (this.usingLoading && this.isInit) return;
      const usingRequest = this.$request[this.queryFunc];
      if (!usingRequest || (typeof usingRequest !== 'function')) {
        console.warn('invalid request function=', this.queryFunc)
        return;
      }
      this.usingLoading = true;
      // 与父级统一loading
      this.$emit('update:tableLoading', true)
      const that = this;
      const {pageNum = 1, pageSize = 20} = this.listQuery;
      // console.log('query',this.listQuery, searchParams)
      usingRequest({
        offset: (pageNum - 1) * pageSize,
        limit: pageSize,
        ...this.listQuery, ...searchParams,
        // mock数据 request.test会返回mockRes
        // mockRes: {
        //   list: [
        //   ],
        //   pageNum,
        //   pageSize,
        //   total: 40,
        //   status: 200,
        // }
      }).then((res) => {
        // console.log('_queryData',searchParams,res)
        if (that.handleRes && (typeof that.handleRes === 'function')) {
          const result = that.handleRes(res)
          // console.log({result});
          const {pageNum: _pageNum, pageSize: _pageSize, total = 0, list = []} = result;
          that.$set(that, 'tableData', list);
          this.listQuery.pageNum = _pageNum || pageNum
          that.listQuery.pageSize = _pageSize || pageSize
          that.total = total
        } else {
          that.$set(that, 'tableData', res.list || []);
          that.listQuery.pageNum = pageNum
          that.listQuery.pageSize = pageSize
          that.total = res.total || 0
        }
      }).catch(e => {
        console.warn(this.queryFunc, e)
      }).finally(() => {
        this.isInit = true;
        if (this.selectedList?.length) this.selectedRefill();
        setTimeout(() => {
          this.usingLoading = false;
          this.$emit('update:tableLoading', false)
        }, 300)
      })
    },
    // 表格滚动至顶部
    _tableScrollTop() {
      const tableRef = this.$refs[this.tableRowKey+ 'table'];
      if (tableRef?.bodyWrapper?.scrollTop) {
        tableRef.bodyWrapper.scrollTop = 0
      }
    },
    // 当前切换页数
    currentChangeFn(num = {page: 1, limit: 20}){
      const {page = 1, limit = 20} = num;
      this.listQuery.pageNum = page;
      this.listQuery.pageSize = limit;
      // 此处需要延时，因为若 total = 180, limit = 20, page = 6,
      // 此时切换 limit = 50, 此函数会被调用两次
      // 第一次 {page: 6, limit: 50} 此次值有误，因数据无第6页
      // 第二次 {page: 4, limit: 50} 此次为正确值
      debounceTool(() => {
        this._tableScrollTop();
        this._queryData()
      }, 300, 'pageSizeChange')
    },
    selectedRefill() {
      const {rowKey = ''} = this.tableConfig;
      if (!this.selectedList?.length) {
        this.$refs[this.tableRowKey+ 'table']?.clearSelection();
        return;
      }
      this.tableData.forEach((row) => {
        // 此处不必处理 checkedMap 因为已经在 watch 中处理了
        const {id = ''} = row;
        const rowId = (rowKey && row[rowKey]) || id;
        const matchRow = this.checkedMapBackup.get(rowId)
        matchRow && (this.$refs[this.tableRowKey+ 'table']?.toggleRowSelection(matchRow));
      })
    },
    // 表格 选择全部
    handleSelectAll(selection, param, awakeChange = true) {
      const checkedMap = new Map();
      const checkedMapBackup = new Map();
      const {rowKey = ''} = this.tableConfig;
      selection.forEach(item => {
        const {id} = item;
        const rowId = (rowKey && item[rowKey]) || id;
        if (!checkedMap.has(rowId)) {
          checkedMap.set(rowId, {
            ...item,
            mapIdx: mapIdx++
          })
          checkedMapBackup.set(rowId, item)
        }
      })
      this.checkedMap = checkedMap;
      this.checkedMapBackup = checkedMapBackup;
      awakeChange && this.$emit('select-change', checkedMap)
    },
    handleSelect(selectRow, row) {
      const {id = ''} = row;
      const {rowKey = ''} = this.tableConfig;
      const rowId = (rowKey && row[rowKey]) || id;
      if (this.checkedMap.has(rowId)) {
        this.checkedMap.delete(rowId)
        this.checkedMapBackup.delete(rowId)
      } else {
        this.checkedMap.set(rowId, {
          ...row,
          mapIdx: mapIdx++
        })
        this.checkedMapBackup.set(rowId, row)
      }
      this.$emit('select-change', this.checkedMap)
    },
    /**
     * 改变某一行选择状态
     * @param row
     * @param status {boolean = true}
     * @param updateCheckedMap {boolean = false} 更改后是否更新 checkedMap 会唤起 select-change
     * @returns {boolean} 是否更改成功
     */
    handleChangeRowSelectStatus(row, status = true, updateCheckedMap = false) {
      try {
        const {id = ''} = row;
        const {rowKey = ''} = this.tableConfig;
        const rowId = (rowKey && row[rowKey]) || id;
        // console.log({row, status, rowId})
        // checkedMapBackup 中存在 => 为已选择元素 不必再跑tableData
        // checkedMapBackup 中不存在 => 为未选择元素 只能跑tableData
        // 两个都不存在? => 可能为其他页的数据回显 尽量避免这种操作?  不 允 许 这种操作!
        const matchRow = this.checkedMapBackup.get(rowId) ?? this.tableData.find((rowItem) => rowItem[rowKey] === rowId)
        matchRow && (this.$refs[this.tableRowKey+ 'table']?.toggleRowSelection(matchRow));
        if (updateCheckedMap) {
          if (!status && this.checkedMap.has(rowId)) {
            this.checkedMap.delete(rowId)
            this.checkedMapBackup.delete(rowId)
          } else if (status) {
            this.checkedMap.set(rowId, {
              ...matchRow,
              mapIdx: mapIdx++
            })
            this.checkedMapBackup.set(rowId, row)
          }
          this.$nextTick(() => {
            this.$emit('select-change', this.checkedMap)
          })
        }
        return !!matchRow;
      } catch (e) {
        console.warn(e)
        return false;
      }
    },
    // 清理多选
    cleanCheckedMap() {
      this.checkedMap = new Map();
      this.checkedMapBackup = new Map();
      this.$refs[this.tableRowKey+ 'table']?.clearSelection();
      this.$emit('select-change', this.checkedMap);
    },
    tableCellClick(row, column) {
      const {property = ''} = column;
      if (this.messageIsShow || !this.dblclickCopy || !property || this.copyError) return;
      this.messageIsShow = true;
      this.$message('双击单元格可以复制内容哦~')
    },
    canIUseCopy() {
      if ((typeof navigator?.clipboard?.writeText) === 'function') {
        navigator.clipboard.writeText('').then(() => {
        }).catch(e => {
          this.copyError = true;
        });
      } else {
        this.copyError = true;
      }
    },
    tableCellDBClick(row, column) {
      const {property = ''} = column;
      if (this.copyError || !this.dblclickCopy || !property) return;
      const value = row[property] || ''
      if (value === '') return;
      navigator.clipboard.writeText(row[property] || '').then(() => {
        this.$message.success('已复制')
      }).catch(e => {

        this.copyError = true;
        this.$message.warning('抱歉，未复制成功，可能是兼容性或数据格式问题，请尝试手动复制')
        console.warn(e)
      });
    },
    handleShortFilterCard() {
      this.shortFilterCard = !this.shortFilterCard
    }

  }
}
</script>

<style lang="scss" scoped>
// 目前可配置的变量
// --component-padding 10px table-page外包裹层padding
// --filter-card-margin-bottom 10px filter-card底部间距
// --filter-card-margin-bottom 10px filter-card底部间距
// --filter-card-short-height 50px filter-card收缩时的高度
// --filter-card-short-height 50px filter-card收缩时的高度
//@import "src/styles/variables";
@import "../../../sass/variables.scss";
@import "../../../sass/mixin.scss";
.component-table-page {
  padding: var(--component-padding, 10px);
  .filter-card {
    margin-bottom: var(--filter-card-margin-bottom, 10px);
    height: fit-content;
    //position: relative;
    transition: height 0.3s;
    .filter-card-content {
      ::v-deep {
        .el-form {
          margin-bottom: -22px;
        }
      }
    }
    .short-ctrl-btn {
      position: -webkit-sticky;
      position: sticky;
      transition: opacity 0.3s;
      float: right;
      right: $span4S;
      bottom: 3px;
      opacity: 0;
      width: 0;
      padding: 0;
      overflow: hidden;
    }
    &:hover {
      .short-ctrl-btn {
        width: auto;
        opacity: 1;
      }
    }
    &.short-card {
      .filter-card-content {
        height: var(--filter-card-short-height, 50px);
        overflow: auto;
        @include scrollBar();
      }
    }
  }
  .component-content {
    width: 100%;
    overflow: visible;
    .content-card {
      overflow: auto;
      @include scrollBar();
      &.use-table-scroll-bar {
        ::v-deep {
          .el-table__body-wrapper {
            @include scrollBar();
          }
        }
      }
    }
    // safari适配
    .content-card-main-table {
      ::v-deep {
        .el-table__header, .el-table__body, .el-table__footer{
          width:100% !important;
          table-layout: fixed !important;
        }
      }
    }
    ::v-deep .pagination-container {
      margin-top: $span3S;
      padding: 0 $spanXS;
    }
  }
}
</style>
