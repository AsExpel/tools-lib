<template>
  <!--增加on-change和on-remove的钩子,el-upload里面绑定一个占位class：-->
  <div class="component-limit-image-card-upload">
    <el-upload
      action="#"
      list-type="picture-card"
      :auto-upload="false"
      :class="{hide: hideUpload, 'limit-image-card-upload': true, 'is-single-list': limit === 1}"
      :style="{'--image-size': imgSize}"
      :file-list="fileList"
      :disabled="disabled"
      :limit="limit"
      :accept="accept"
      :before-upload="checkFile"
      ref="pictureCardUploader"
      :on-change="handleChange" v-loading="usingLoading">
      <div class="default-warp" slot="default">
        <i class="el-icon-plus" v-if="!disabled"></i>
        <i class="el-icon-picture-outline" v-else></i>
      </div>
      <div slot="file" slot-scope="{file}" class="upload-file-wrap">
        <el-image class="el-upload-list__item-thumbnail" fit="contain" :src="file.url" alt=""/>
        <span class="el-upload-list__item-actions">
        <span class="el-upload-list__item-preview" @click="handlePictureCardPreview(file)">
          <i class="el-icon-zoom-in"></i>
        </span>
        <span v-if="!disabled" class="el-upload-list__item-delete" @click="fileRemove(file)">
          <i class="el-icon-delete"></i>
        </span>
      </span>
      </div>
    </el-upload>
<!--    <el-image-viewer-->
<!--      v-if="dialogVisible && dialogImageUrl"-->
<!--      key="dialogVisible"-->
<!--      :on-close="closeViewer" :z-index="2030"-->
<!--      :url-list="[dialogImageUrl]" />-->
<!--    <el-dialog :visible.sync="dialogVisible" append-to-body>-->
<!--      <img width="100%" :src="dialogImageUrl" alt="">-->
<!--    </el-dialog>-->
  </div>

</template>

<script>
// 导入图片预览组件 如果没有绑定全局的ElImageViewer，此处可启用
// import ElImageViewer from 'element-ui/packages/image/src/image-viewer'
export default {
  name: "LimitImageCardUpload",
  // components: {ElImageViewer},
  props: {
    // 图片数量限制
    limit: {
      type: Number,
      default: 1
    },
    // 图片url,可为字符串或数组
    fileUrl: {
      default: ''
    },
    // 图片卡片大小
    imgSize: {
      type: String,
      default: '190px'
    },
    autoUpload: {
      type: Boolean,
      default: true
    },
    // 父级是否正在加载
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    changeParams: {
      default: () => ({})
    },
    // 允许的文件类型
    accept: {
      type: String,
      // default: 'image/jpeg,.png,.jpg'
      default: '.png,.jpg'
    },
    // 图片尺寸限制
    sizeLimit: {
      type: Number,
      default: 2
    },
    // 图片上传失败tip自定义,目前只有文件超大(oversize)时使用
    tipMap: {
      type: Object,
      default: () => ({
        oversize: ''
      })
    }
  },
  data() {
    return {
      dialogImageUrl: '',
      isLoading: false,
      uploadedIdMap: new Map(),
      // dialogVisible: false
    };
  },
  mounted() {
  },
  computed: {
    usingLoading() {
      return this.isLoading || this.loading
    },
    hideUpload() {
      return  this.fileList.length >= this.limit;
    },
    fileList() {
      const fileUrl = this.fileUrl;
      if (typeof fileUrl === 'string') {
        return fileUrl ? [{
          name: 'img',
          url: fileUrl
        }] : []
      } else if (fileUrl instanceof Array) {
        return fileUrl.map((item, idx) => ({
          name: idx,
          url: item
        }))
      }
      return []
    }
  },
  methods: {
    //onChange 对应的处理函数（添加文件、上传成功和上传失败时都会被调用的那个）：
    handleChange(file,fileList){
      // console.log('handleChange', file, fileList)
      if (this.autoUpload) {
        // this.$emit('update:fileUrl', this.limit === 1 ? (file.url || '') : (this.fileUrl instanceof Array ? this.fileUrl.concat([file.url]): [file.url]))
        const result = this.checkFile(file)
        if (result) {
          this.uploadFileFn(file)
        } else {
          this._unUploadedFileRemove({fileIdx: fileList.length - 1})
          this.$emit('change', {file: {}, fileList: [], params: this.changeParams, common: 'del'})
        }
      } else {
        this.$emit('change', {file, fileList, params: this.changeParams})
      }
    },

    checkFile(file) {
      const usingFile = file.raw ?? file
      const {size:fileSize = 0, type = '', name = ''} = usingFile || {}
      let result = true;
      // 依据accept属性，判断是否符合文件类型
      if (result && this.accept) {
        const acceptArr = this.accept.split(',');
        const acceptType = acceptArr.find(item => type.indexOf(item) >= 0 || name.endsWith(item))
        if (!acceptType) {
          this.$message.error('上传格式不正确!');
          // console.warn('acceptType does not match', acceptType, acceptArr);
          result = false
        }
      }
      // 判断文件大小是否合规
      if (result && this.sizeLimit) {
        const overSize = fileSize / 1024 / 1024 > this.sizeLimit;
        if (overSize) {
          const {oversize:oversizeTip = ''} = this.tipMap
          this.$message.error(oversizeTip ? oversizeTip : `上传图片大小不能超过 ${this.sizeLimit}MB!`);
          result = false
        }
      }
      return result;
    },
    /**
     * 上传前的文件删除
     * @param fileIdx {Number: 0} 需要删除的文件序号 默认0
     * @param awakeChange {Boolean: false} 是否唤起正常删除流程 默认false
     */
    _unUploadedFileRemove({fileIdx = 0, awakeChange = false}) {
      let arr = this.$refs.pictureCardUploader.uploadFiles
      arr.splice(fileIdx, 1)
      if (awakeChange) {
        this.fileRemove({})
      }
    },
    // 删除文件处理，一般由用户点击删除按钮触发，_unUploadedFileRemove中可选择触发
    fileRemove(file) {
      // console.log(file);
      if (this.limit === 1) {
        this.$emit('update:fileUrl', '')
      } else {
        const {url = ''} = file;
        const result = this.fileUrl.filter(item => item !== url)
        // console.log('fileRemove', result, url)
        this.$emit('update:fileUrl', result)
      }
      this.$emit('change', {file, params: this.changeParams, common: 'del'})
    },
    handlePictureCardPreview(scope) {
      // console.log(scope)
      if (!this.fileUrl) return;
      const {url = ''} = scope;
      const isArrayList = this.fileUrl instanceof Array;
      const matchIdx = isArrayList ? this.fileUrl.findIndex(item => item === url) : 0;
      // todo 此处是调用了全局绑定的elementUI图片预览组件 如果未全局绑定,可以启用上方的el-image-viewer
      // this.$openImageViewer(isArrayList ? this.fileUrl :[url], {
      //   zIndex: 2950,
      //   initialIndex: matchIdx > -1 ? matchIdx : 0
      // })
      // this.dialogVisible = true;
    },
    uploadFileFn(file) {
      const that = this;
      const formData = new FormData()
      formData.append('file', file.raw)
      this.isLoading = true;
      // todo 此处请换成自己的上传函数
      this.$request.uploadFile(formData).then(res => {
        const {result:{msg = ''} = {}, data = {}} = res;
        const {id = '', url = ''} = data;
        if (msg !== '成功') {
          console.warn('upload error', res)
          that.$message.warning(msg || '未知错误，请稍后重试')
        }
        that.uploadedIdMap.set(url, id);
        // 调用父级change事件，更新fileUrl变量
        that.$emit('update:fileUrl', this.limit === 1 ? url : (this.fileUrl instanceof Array ? this.fileUrl.concat([url]): [url]))
        that.$emit('change', {file, data, params: that.changeParams})
        // this.baseInfoData[name] = id
        // this.$set(that.imageUrlMap, name, url)
      }).catch((err) => {
        console.warn('upload error catch', err)
        this.$message.warning(err?.message || '未知错误，请稍后重试');
      }).finally(() => {
        this.isLoading = false;
      })
    },
    /**
     * 供父级调用的使用url换取id
     * @param aimUrl 需要换取的url
     * @param clear 获取结果后是否清空该map
     * @returns {any|string|Map<any, any>}
     */
    handleQueryUploadedId({aimUrl = '', clear = false}) {
      const result = aimUrl? (this.uploadedIdMap.get(aimUrl) || '') : new Map(this.uploadedIdMap)
      clear && (this.uploadedIdMap.clear())
      return result;
    },
    handleInitUploadedId(initMap = new Map()) {
      this.uploadedIdMap = initMap;
    },
    closeViewer() {
      this.dialogVisible = false
    }

  }
}
</script>

<style lang="scss" scoped>
.component-limit-image-card-upload {
  $imgSize: var(--image-size, 190px);
  transition: box-shadow 0.3s;
  .limit-image-card-upload {
    &.is-single-list {
      width: $imgSize;
      height: $imgSize;
      overflow: hidden;
    }
    &.hide {
      ::v-deep {
        .el-upload--picture-card {
          display: none;
        }
      }
    }
  }
  ::v-deep {
    .el-upload-list__item {
      width: $imgSize;
      height: $imgSize;
      &:last-child {
        margin: 0 0 8px;
      }
      .upload-file-wrap {
        font-size: 0;
        width: 100%;
        height: 100%;
        @include fnCenter();
      }
    }
  }

  .warning & {
    box-shadow: 0 0 2px #ff9001;
    ::v-deep {
      .el-upload--picture-card {
        border-color: $yellow;
      }
    }
  }
  .error & {
    box-shadow: 0 0 2px #9a0106;
    ::v-deep {
      .el-upload--picture-card {
        border-color: $red;
      }
    }
  }
}
</style>
