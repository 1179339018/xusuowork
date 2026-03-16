import { defineStore } from 'pinia'

export const useDisputeStore = defineStore('dispute', {
	state: () => ({
		disputeList: [], // 纠纷列表
		currentDispute: null, // 当前查看的纠纷
		loading: false,
		page: 1,
		pageSize: 10,
		hasMore: true
	}),
	
	getters: {
		// 待分派数量（街道）
		pendingAssignCount: (state) => {
			return state.disputeList.filter(item => item.status === '待分派').length
		},
		
		// 待回访数量（社区）
		pendingVisitCount: (state) => {
			return state.disputeList.filter(item => item.status === '待回访').length
		},
		
		// 已化解数量
		resolvedCount: (state) => {
			return state.disputeList.filter(item => item.status === '已化解').length
		},
		
		// 今日新增数量
		todayNewCount: (state) => {
			const today = new Date().toISOString().split('T')[0]
			return state.disputeList.filter(item => {
				const createDate = new Date(item.create_time).toISOString().split('T')[0]
				return createDate === today
			}).length
		}
	},
	
	actions: {
		// 设置纠纷列表
		setDisputeList(list) {
			this.disputeList = list
		},
		
		// 添加纠纷
		addDispute(dispute) {
			this.disputeList.unshift(dispute)
		},
		
		// 更新纠纷
		updateDispute(id, data) {
			const index = this.disputeList.findIndex(item => item._id === id)
			if (index !== -1) {
				this.disputeList[index] = { ...this.disputeList[index], ...data }
			}
			if (this.currentDispute && this.currentDispute._id === id) {
				this.currentDispute = { ...this.currentDispute, ...data }
			}
		},
		
		// 设置当前纠纷
		setCurrentDispute(dispute) {
			this.currentDispute = dispute
		},
		
		// 重置分页
		resetPage() {
			this.page = 1
			this.hasMore = true
		},
		
		// 加载更多
		loadMore() {
			if (this.hasMore && !this.loading) {
				this.page++
			}
		}
	}
})
