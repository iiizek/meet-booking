export type Response<T> =
	| {
			success: true;
			data: T;
			message?: string;
	  }
	| {
			success: false;
			error: string;
	  };

